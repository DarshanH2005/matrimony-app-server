/**
 * Seed Dummy Users Script
 *
 * Creates 10 test users with complete profiles for testing
 * Run: node scripts/seedDummyUsers.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import User model
const User = require("../models/User");

// Sample data for generating realistic profiles
const firstNamesMale = [
  "Rahul",
  "Amit",
  "Vikram",
  "Arjun",
  "Suresh",
  "Rajesh",
  "Kiran",
  "Deepak",
  "Anil",
  "Sanjay",
];
const firstNamesFemale = [
  "Priya",
  "Neha",
  "Kavita",
  "Sunita",
  "Anjali",
  "Divya",
  "Pooja",
  "Meera",
  "Rashmi",
  "Swati",
];
const lastNames = [
  "Sharma",
  "Patel",
  "Kumar",
  "Singh",
  "Reddy",
  "Rao",
  "Gupta",
  "Joshi",
  "Desai",
  "Naik",
];
const cities = [
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Mysore",
  "Mangalore",
];
const states = [
  "Karnataka",
  "Maharashtra",
  "Delhi",
  "Telangana",
  "Tamil Nadu",
  "Maharashtra",
  "West Bengal",
  "Gujarat",
  "Karnataka",
  "Karnataka",
];
const religions = ["hindu", "muslim", "christian", "sikh", "jain"];
const castes = ["Brahmin", "Kshatriya", "Vaishya", "General", "OBC"];
const languages = ["Kannada", "Hindi", "Telugu", "Tamil", "Marathi", "English"];
const educations = [
  "bachelors",
  "masters",
  "doctorate",
  "diploma",
  "high_school",
];
const professions = [
  "Software Engineer",
  "Doctor",
  "Teacher",
  "Business Owner",
  "Accountant",
  "Manager",
  "Designer",
  "Lawyer",
  "Consultant",
  "Engineer",
];
// Fixed: Use correct enum values from User.js
const incomes = [
  "not_specified",
  "below_3lpa",
  "3_to_5lpa",
  "5_to_10lpa",
  "10_to_15lpa",
  "15_to_25lpa",
  "25_to_50lpa",
  "above_50lpa",
];
const maritalStatuses = ["never_married", "divorced", "widowed"];
// Fixed: Use correct enum values from User.js (no 'extended')
const familyTypes = ["joint", "nuclear"];
const familyValues = ["traditional", "moderate", "liberal"];

// Random helper functions
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate a single user
function generateUser(index, gender) {
  const firstName =
    gender === "male"
      ? randomItem(firstNamesMale)
      : randomItem(firstNamesFemale);
  const lastName = randomItem(lastNames);
  const age = randomNumber(22, 35);
  const cityIndex = randomNumber(0, cities.length - 1);

  return {
    email: `test${index}@matrimony.com`,
    password: "Test@123",
    phone: `+91 98${randomNumber(10000000, 99999999)}`,
    isEmailVerified: true,
    isPhoneVerified: true,
    isProfileComplete: true,
    isVerified: true,
    isActive: true,
    basicInfo: {
      name: `${firstName} ${lastName}`,
      gender: gender,
      dateOfBirth: new Date(
        new Date().getFullYear() - age,
        randomNumber(0, 11),
        randomNumber(1, 28),
      ),
      age: age,
      height: randomNumber(150, 185),
      maritalStatus: randomItem(maritalStatuses),
      city: cities[cityIndex],
      state: states[cityIndex],
      country: "India",
    },
    culturalInfo: {
      religion: randomItem(religions),
      caste: randomItem(castes),
      motherTongue: randomItem(languages),
      gothra: "",
    },
    careerInfo: {
      education: randomItem(educations),
      profession: randomItem(professions),
      company: `${randomItem(["Tech", "Info", "Global", "Digital", "Smart"])} ${randomItem(["Solutions", "Systems", "Corp", "Inc", "Ltd"])}`,
      annualIncome: randomItem(incomes),
      workLocation: cities[cityIndex],
    },
    // Fixed: siblings is an object with brothers/sisters, not a number
    familyInfo: {
      fatherOccupation: randomItem(professions),
      motherOccupation: randomItem([
        "Homemaker",
        "Teacher",
        "Doctor",
        "Business",
      ]),
      siblings: {
        brothers: randomNumber(0, 2),
        sisters: randomNumber(0, 2),
        marriedBrothers: 0,
        marriedSisters: 0,
      },
      familyType: randomItem(familyTypes),
      familyValues: randomItem(familyValues),
    },
    about: `Hi, I am ${firstName}. I am looking for a compatible life partner. I am a ${randomItem(professions).toLowerCase()} by profession and believe in ${randomItem(["family values", "mutual respect", "trust and understanding", "love and care"])}.`,
    photos: [],
    partnerPreferences: {
      ageRange: { min: age - 3, max: age + 5 },
      heightRange: { min: 150, max: 185 },
      religion: [],
      caste: [],
      education: [],
      maritalStatus: [],
    },
    lastActive: new Date(),
  };
}

// Main seeding function
async function seedDummyUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");

    // Check if dummy users already exist
    const existingCount = await User.countDocuments({
      email: /^test\d+@matrimony.com$/,
    });
    if (existingCount > 0) {
      console.log(`\n⚠ Found ${existingCount} existing test users.`);
      console.log("Deleting existing test users...");
      await User.deleteMany({ email: /^test\d+@matrimony.com$/ });
      console.log("✓ Deleted existing test users");
    }

    // Generate users
    console.log("\nGenerating 10 test users...\n");
    const users = [];

    // Create 5 male and 5 female users
    for (let i = 1; i <= 5; i++) {
      users.push(generateUser(i, "male"));
    }
    for (let i = 6; i <= 10; i++) {
      users.push(generateUser(i, "female"));
    }

    // Hash passwords and insert
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);

      const user = new User(userData);
      await user.save();

      console.log(`✓ Created: ${userData.basicInfo.name} (${userData.email})`);
      console.log(
        `  Gender: ${userData.basicInfo.gender}, Age: ${userData.basicInfo.age}, City: ${userData.basicInfo.city}`,
      );
    }

    console.log("\n========================================");
    console.log("✓ Successfully created 10 test users!");
    console.log("========================================");
    console.log("\nTest Account Credentials:");
    console.log("  Email: test1@matrimony.com to test10@matrimony.com");
    console.log("  Password: Test@123");
    console.log("\n");
  } catch (error) {
    console.error("✗ Error seeding users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✓ Disconnected from MongoDB");
  }
}

// Run the script
seedDummyUsers();
