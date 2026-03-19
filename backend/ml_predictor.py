import os
import time
import requests
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

# ==========================================
# 1. ACTUAL CONFIGURATION
# ==========================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://opzpwvxvjinsrzhuiilk.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "YOUR_SUPABASE_SERVICE_KEY") # Ensure this is your actual service_role key

# Important: Setup the HTTP REST Headers for Supabase
headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

WEATHER_API_KEY = "e5c8c35726d52c53ed66735380eae2e9"
CITY = "Pune"

# ==========================================
# 2. TRAIN THE AI MODEL
# ==========================================
print("🌱 [Training Phase] Loading dataset from backend folder...")
try:
    data = pd.read_csv("irrigation_prediction.csv")
    
    mapping = {"Low": 10, "Medium": 25, "High": 40}
    if "Irrigation_Need" in data.columns:
        data["Water_Liters"] = data["Irrigation_Need"].map(mapping)
        data = data.drop("Irrigation_Need", axis=1)

    for column in data.columns:
        if data[column].dtype == "object":
            le = LabelEncoder()
            data[column] = le.fit_transform(data[column])

    X = data.drop("Water_Liters", axis=1)
    y = data["Water_Liters"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestRegressor(random_state=42)
    model.fit(X_train, y_train)
    print("✅ Model trained successfully!")

except Exception as e:
    print(f"❌ Error training model. Make sure 'irrigation_prediction.csv' is in this folder. Details: {e}")
    exit(1)


# ==========================================
# 3. LIVE DATA FETCHING & PREDICTION LOOP
# ==========================================
def get_weather():
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={WEATHER_API_KEY}&units=metric"
        res = requests.get(url)
        data_weather = res.json()
        temp = data_weather["main"]["temp"]
        humidity = data_weather["main"]["humidity"]
        rain = data_weather.get("rain", {}).get("1h", 0)
        wind_speed = data_weather.get("wind", {}).get("speed", 0)
        return temp, humidity, rain, wind_speed
    except Exception as e:
        print("Weather API failed, using fallbacks.")
        return 30.0, 50.0, 0, 5.0 # Safe fallback

print("\n🚀 [Live Phase] Connecting to Supabase natively via REST API...\n")

while True:
    try:
        # 1. Fetch latest reading directly via HTTP GET
        fetch_url = f"{SUPABASE_URL}/rest/v1/sensor_data?select=*&order=created_at.desc&limit=1"
        res = requests.get(fetch_url, headers=headers)
        
        if res.status_code != 200:
            print(f"Error fetching Supabase data: {res.text}")
            time.sleep(30)
            continue
            
        rows = res.json()
        if not rows or len(rows) == 0:
            print("No sensor data found in Supabase yet. Waiting...")
            time.sleep(30)
            continue
            
        latest_sensor = rows[0]
        soil_moisture = latest_sensor.get("moisture", 30)
        hw_temperature = latest_sensor.get("temperature", 25)
        farmer_id = latest_sensor.get("farmer_id", "UNKNOWN")
        record_id = latest_sensor.get("id")

        print(f"📡 Received latest reading from Farmer {farmer_id}: Moisture={soil_moisture}%, Temp={hw_temperature}C")

        # 2. Get Weather
        weather_temp, weather_humidity, weather_rain, wind_speed = get_weather()
        
        # 3. Build Features
        input_data = pd.DataFrame([{
            "Soil_Type": 1,
            "Soil_pH": latest_sensor.get("ph", 6.5),
            "Soil_Moisture": soil_moisture,
            "Organic_Carbon": 0.4,
            "Electrical_Conductivity": 1.2,
            "Temperature_C": hw_temperature,
            "Humidity": weather_humidity,
            "Rainfall_mm": weather_rain,
            "Sunlight_Hours": 8,
            "Wind_Speed_kmh": wind_speed,
            "Crop_Type": 2,
            "Crop_Growth_Stage": 1,
            "Season": 1,
            "Irrigation_Type": 1,
            "Water_Source": 1,
            "Field_Area_hectare": 1.5,
            "Mulching_Used": 0,
            "Previous_Irrigation_mm": 5,
            "Region": 1
        }])

        # 4. Predict
        water_required = model.predict(input_data)[0]
        water_required = round(water_required)
        
        # 5. Logic
        alerts = []
        if water_required > 25: alerts.append("Irrigation required today")
        if weather_rain > 5: alerts.append("Rain expected - irrigation postponed")
        if soil_moisture > 70: alerts.append("Soil moisture already high")
        decision_flags = ", ".join(alerts) if alerts else "Conditions Normal"

        print(f"🤖 AI Prediction: {water_required} Liters | Logic: {decision_flags}")

        # 6. Push Prediction Back to Supabase via HTTP PATCH
        # update_url = f"{SUPABASE_URL}/rest/v1/sensor_data?id=eq.{record_id}"
        # payload = {"predicted_water_liters": water_required, "ai_decision": decision_flags}
        # patch_res = requests.patch(update_url, headers=headers, json=payload)
        # if patch_res.status_code >= 400:
        #    print(f"Failed to push update to Supabase: {patch_res.text}")

    except Exception as e:
        print(f"Error during live evaluation: {e}")

    # Wait 30 seconds
    time.sleep(30)
