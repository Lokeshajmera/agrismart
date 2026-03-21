import fs from 'fs';

const file = 'C:/Users/Lokesh/OneDrive/Desktop/Proper/New/Hackathon/frontend/src/context/AlertsContext.jsx';
let content = fs.readFileSync(file, 'utf8');

const reps = [
    ["bg-red-50", "bg-red-50 dark:bg-red-900/30"],
    ["border-red-200", "border-red-200 dark:border-red-800/50"],
    ["text-red-500", "text-red-500 dark:text-red-400"],
    ["text-red-600", "text-red-600 dark:text-red-400"],

    ["bg-orange-50", "bg-orange-50 dark:bg-orange-900/30"],
    ["border-orange-200", "border-orange-200 dark:border-orange-800/50"],
    ["text-orange-500", "text-orange-500 dark:text-orange-400"],
    ["text-orange-600", "text-orange-600 dark:text-orange-400"],

    ["bg-blue-50", "bg-blue-50 dark:bg-blue-900/30"],
    ["border-blue-200", "border-blue-200 dark:border-blue-800/50"],
    ["text-blue-500", "text-blue-500 dark:text-blue-400"],
    ["text-blue-600", "text-blue-600 dark:text-blue-400"],

    ["bg-green-50", "bg-green-50 dark:bg-green-900/30"],
    ["text-green-500", "text-green-500 dark:text-green-400"],
    ["text-green-600", "text-green-600 dark:text-green-400"],

    ["bg-purple-50", "bg-purple-50 dark:bg-purple-900/30"],
    ["text-purple-600", "text-purple-600 dark:text-purple-400"],

    ["bg-yellow-50", "bg-yellow-50 dark:bg-yellow-900/30"],
    ["text-yellow-600", "text-yellow-600 dark:text-yellow-400"]
];

for(const [find_str, rep_str] of reps) {
    content = content.split("'" + find_str + "'").join("'" + rep_str + "'");
}

fs.writeFileSync(file, content);
console.log("Replaced in AlertsContext");

const dashfile = 'C:/Users/Lokesh/OneDrive/Desktop/Proper/New/Hackathon/frontend/src/pages/Dashboard.jsx';
let dash = fs.readFileSync(dashfile, 'utf8');

dash = dash
.split("bg-nature-50").join("bg-nature-50 dark:bg-nature-900")
.split("border-nature-100").join("border-nature-100 dark:border-nature-700/50")
.split("dark:bg-nature-900 dark:bg-nature-900").join("dark:bg-nature-900")
.split("dark:border-nature-700/50/50").join("dark:border-nature-700/50")
.split("dark:border-nature-700/50 dark:border-nature-700/50").join("dark:border-nature-700/50")
.split("dark:bg-nature-900/50 font-bold tracking-wider").join("font-bold tracking-wider")

.split("bg-blue-50").join("bg-blue-50 dark:bg-blue-900/30")
.split("border-blue-100").join("border-blue-100 dark:border-blue-800/50")

.split("bg-cyan-50").join("bg-cyan-50 dark:bg-cyan-900/30")
.split("border-cyan-100").join("border-cyan-100 dark:border-cyan-800/50")

.split("bg-purple-50").join("bg-purple-50 dark:bg-purple-900/30")
.split("border-purple-100").join("border-purple-100 dark:border-purple-800/50")

.split("bg-red-50 ").join("bg-red-50 dark:bg-red-900/30 ")
.split("border-red-100 ").join("border-red-100 dark:border-red-800/50 ")

.split("bg-earth-50 ").join("bg-earth-50 dark:bg-earth-900/30 ")
.split("border-earth-100").join("border-earth-100 dark:border-earth-800/50");

fs.writeFileSync(dashfile, dash);
console.log("Replaced in Dashboard");
