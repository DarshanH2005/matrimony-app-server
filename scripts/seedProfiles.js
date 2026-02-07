/**
 * Seed Script - Realistic Indian Matrimony Profiles
 *
 * Creates realistic Indian profiles with:
 * - Authentic Indian names
 * - Real photos from randomuser.me (Indian locale)
 * - Realistic career and education data
 * - Proper cultural information
 *
 * Run: node scripts/seedProfiles.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Admin = require("../models/Admin");

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};

// Realistic Indian profile data
const maleProfiles = [
    {
        name: "Arjun Sharma",
        age: 28,
        height: 175,
        city: "Bangalore",
        state: "Karnataka",
        religion: "Hindu",
        caste: "Brahmin",
        motherTongue: "Hindi",
        education: "B.Tech",
        educationDetails: "Computer Science from IIT Delhi",
        profession: "Software Engineer",
        company: "Google India",
        income: "25-30 LPA",
        about: "Passionate software engineer working at Google. I love traveling, photography, and exploring new cuisines. Looking for someone who shares my values of family and career balance.",
        photo: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
        name: "Vikram Patel",
        age: 30,
        height: 178,
        city: "Mumbai",
        state: "Maharashtra",
        religion: "Hindu",
        caste: "Patel",
        motherTongue: "Gujarati",
        education: "MBA",
        educationDetails: "IIM Ahmedabad",
        profession: "Investment Banker",
        company: "JP Morgan",
        income: "35-40 LPA",
        about: "Finance professional with a passion for fitness and music. I believe in work-life balance and spending quality time with family. Looking for a life partner who is ambitious yet grounded.",
        photo: "https://randomuser.me/api/portraits/men/44.jpg",
    },
    {
        name: "Rahul Reddy",
        age: 27,
        height: 172,
        city: "Hyderabad",
        state: "Telangana",
        religion: "Hindu",
        caste: "Reddy",
        motherTongue: "Telugu",
        education: "M.Tech",
        educationDetails: "BITS Pilani",
        profession: "Data Scientist",
        company: "Amazon",
        income: "20-25 LPA",
        about: "Data scientist who loves solving complex problems. In my free time, I enjoy playing cricket, reading books, and learning new technologies. Family-oriented and looking for a compatible partner.",
        photo: "https://randomuser.me/api/portraits/men/55.jpg",
    },
    {
        name: "Aditya Iyer",
        age: 29,
        height: 170,
        city: "Chennai",
        state: "Tamil Nadu",
        religion: "Hindu",
        caste: "Iyer",
        motherTongue: "Tamil",
        education: "MBBS",
        educationDetails: "AIIMS Delhi",
        profession: "Doctor",
        company: "Apollo Hospitals",
        income: "15-20 LPA",
        about: "Dedicated doctor specializing in cardiology. I value honesty, compassion, and a good sense of humor. Looking for someone who understands the demands of a medical profession.",
        photo: "https://randomuser.me/api/portraits/men/67.jpg",
    },
    {
        name: "Karan Singh",
        age: 31,
        height: 180,
        city: "Delhi",
        state: "Delhi",
        religion: "Sikh",
        caste: "Jat Sikh",
        motherTongue: "Punjabi",
        education: "B.Com, CA",
        educationDetails: "SRCC Delhi, ICAI",
        profession: "Chartered Accountant",
        company: "Deloitte",
        income: "18-22 LPA",
        about: "Chartered Accountant with a love for adventure sports and traveling. I come from a close-knit Punjabi family and believe in traditional values with a modern outlook.",
        photo: "https://randomuser.me/api/portraits/men/78.jpg",
    },
    {
        name: "Rohan Kapoor",
        age: 26,
        height: 176,
        city: "Pune",
        state: "Maharashtra",
        religion: "Hindu",
        caste: "Khatri",
        motherTongue: "Hindi",
        education: "B.Tech",
        educationDetails: "NIT Trichy",
        profession: "Product Manager",
        company: "Microsoft",
        income: "22-28 LPA",
        about: "Product manager who loves building products that impact millions. Foodie, movie buff, and occasional guitarist. Looking for someone with a zest for life.",
        photo: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    {
        name: "Siddharth Joshi",
        age: 28,
        height: 174,
        city: "Ahmedabad",
        state: "Gujarat",
        religion: "Hindu",
        caste: "Brahmin",
        motherTongue: "Gujarati",
        education: "B.Tech, MBA",
        educationDetails: "IIT Bombay, ISB Hyderabad",
        profession: "Management Consultant",
        company: "McKinsey",
        income: "40-50 LPA",
        about: "Strategy consultant who enjoys problem-solving and traveling. I value intellectual conversations and am looking for a partner who is curious about the world.",
        photo: "https://randomuser.me/api/portraits/men/33.jpg",
    },
    {
        name: "Pranav Menon",
        age: 29,
        height: 171,
        city: "Kochi",
        state: "Kerala",
        religion: "Hindu",
        caste: "Nair",
        motherTongue: "Malayalam",
        education: "B.Tech",
        educationDetails: "NIT Calicut",
        profession: "Senior Developer",
        company: "Infosys",
        income: "15-18 LPA",
        about: "Software developer with expertise in cloud technologies. Love Kerala cuisine, beaches, and classical music. Looking for a kind-hearted partner who values relationships.",
        photo: "https://randomuser.me/api/portraits/men/45.jpg",
    },
];

const femaleProfiles = [
    {
        name: "Priya Nair",
        age: 26,
        height: 162,
        city: "Bangalore",
        state: "Karnataka",
        religion: "Hindu",
        caste: "Nair",
        motherTongue: "Malayalam",
        education: "B.Tech",
        educationDetails: "VIT Vellore",
        profession: "UX Designer",
        company: "Flipkart",
        income: "18-22 LPA",
        about: "Creative UX designer passionate about user-centric design. I love painting, yoga, and exploring cafes. Looking for someone with a good sense of humor and family values.",
        photo: "https://randomuser.me/api/portraits/women/32.jpg",
    },
    {
        name: "Ananya Gupta",
        age: 25,
        height: 160,
        city: "Delhi",
        state: "Delhi",
        religion: "Hindu",
        caste: "Agarwal",
        motherTongue: "Hindi",
        education: "MBA",
        educationDetails: "FMS Delhi",
        profession: "Marketing Manager",
        company: "Unilever",
        income: "20-25 LPA",
        about: "Marketing professional who loves brand storytelling. Passionate about reading, traveling, and trying new cuisines. Looking for an ambitious partner who respects individuality.",
        photo: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
        name: "Shreya Kulkarni",
        age: 27,
        height: 158,
        city: "Pune",
        state: "Maharashtra",
        religion: "Hindu",
        caste: "Brahmin",
        motherTongue: "Marathi",
        education: "MBBS, MD",
        educationDetails: "KEM Mumbai",
        profession: "Doctor",
        company: "Tata Memorial Hospital",
        income: "12-15 LPA",
        about: "Dedicated oncologist who believes in making a difference. I enjoy classical dance, reading, and spending time with family. Looking for an understanding and supportive partner.",
        photo: "https://randomuser.me/api/portraits/women/55.jpg",
    },
    {
        name: "Kavitha Rajan",
        age: 28,
        height: 165,
        city: "Chennai",
        state: "Tamil Nadu",
        religion: "Hindu",
        caste: "Iyer",
        motherTongue: "Tamil",
        education: "B.Tech, MS",
        educationDetails: "Anna University, Stanford University",
        profession: "Data Scientist",
        company: "Netflix",
        income: "35-40 LPA",
        about: "Data scientist with a PhD in Machine Learning. I love Bharatanatyam, South Indian music, and cooking. Looking for someone who appreciates both tradition and modernity.",
        photo: "https://randomuser.me/api/portraits/women/67.jpg",
    },
    {
        name: "Neha Agarwal",
        age: 26,
        height: 163,
        city: "Mumbai",
        state: "Maharashtra",
        religion: "Hindu",
        caste: "Agarwal",
        motherTongue: "Hindi",
        education: "B.Com, CA",
        educationDetails: "HR College Mumbai, ICAI",
        profession: "Chartered Accountant",
        company: "EY",
        income: "16-20 LPA",
        about: "CA working in audit and consulting. I enjoy traveling, fitness, and binge-watching shows. Looking for a partner who values honesty and has a positive outlook on life.",
        photo: "https://randomuser.me/api/portraits/women/78.jpg",
    },
    {
        name: "Divya Krishnan",
        age: 24,
        height: 157,
        city: "Hyderabad",
        state: "Telangana",
        religion: "Hindu",
        caste: "Brahmin",
        motherTongue: "Telugu",
        education: "B.Tech",
        educationDetails: "IIIT Hyderabad",
        profession: "Software Developer",
        company: "Adobe",
        income: "14-18 LPA",
        about: "Frontend developer who loves creating beautiful web experiences. Passionate about music, dancing, and traveling. Looking for someone caring and adventurous.",
        photo: "https://randomuser.me/api/portraits/women/22.jpg",
    },
    {
        name: "Meera Pillai",
        age: 27,
        height: 161,
        city: "Trivandrum",
        state: "Kerala",
        religion: "Hindu",
        caste: "Nair",
        motherTongue: "Malayalam",
        education: "B.Arch",
        educationDetails: "NIT Calicut",
        profession: "Architect",
        company: "Foster + Partners",
        income: "12-15 LPA",
        about: "Architect with a passion for sustainable design. I love nature, photography, and Kerala cuisine. Looking for someone who appreciates art and culture.",
        photo: "https://randomuser.me/api/portraits/women/33.jpg",
    },
    {
        name: "Riya Deshmukh",
        age: 25,
        height: 164,
        city: "Nagpur",
        state: "Maharashtra",
        religion: "Hindu",
        caste: "Maratha",
        motherTongue: "Marathi",
        education: "MBA",
        educationDetails: "XLRI Jamshedpur",
        profession: "HR Manager",
        company: "TCS",
        income: "15-18 LPA",
        about: "HR professional who enjoys building great workplace cultures. Love reading, cooking, and weekend getaways. Looking for a life partner who values communication and respect.",
        photo: "https://randomuser.me/api/portraits/women/45.jpg",
    },
];

// Create user from profile data
const createUser = async (profile, gender, index) => {
    const email = `${profile.name.toLowerCase().replace(/\s/g, ".")}@example.com`;
    const hashedPassword = await bcrypt.hash("password123", 12);

    const user = new User({
        phone: `98${String(index).padStart(8, "0")}${gender === "male" ? "1" : "2"}`,
        email,
        password: hashedPassword,
        isPhoneVerified: true,
        isEmailVerified: true,
        profilePhoto: profile.photo,
        basicInfo: {
            name: profile.name,
            age: profile.age,
            gender: gender,
            dob: new Date(2026 - profile.age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            height: profile.height,
            weight: gender === "male" ? 70 + Math.floor(Math.random() * 15) : 55 + Math.floor(Math.random() * 15),
            maritalStatus: "never_married",
            city: profile.city,
            state: profile.state,
        },
        culturalInfo: {
            religion: profile.religion.toLowerCase(),
            caste: profile.caste,
            motherTongue: profile.motherTongue,
            diet: Math.random() > 0.5 ? "Vegetarian" : "Non-Vegetarian",
            drinking: "Never",
            smoking: "Never",
        },
        careerInfo: {
            education: profile.education.includes("M.") || profile.education.includes("MBA") || profile.education.includes("MD") || profile.education.includes("CA") ? "masters" : "bachelors",
            educationDetail: profile.educationDetails,
            profession: profile.profession,
            company: profile.company,
            annualIncome: "15_to_25lpa", // Default for now to pass validation, or map specifically
            workCity: profile.city,
        },
        familyInfo: {
            fatherOccupation: gender === "male" ? "Business" : "Retired",
            motherOccupation: "Homemaker",
            siblings: {
                brothers: Math.floor(Math.random() * 2),
                sisters: Math.floor(Math.random() * 2),
            },
            familyType: Math.random() > 0.5 ? "nuclear" : "joint",
            familyStatus: "middle_class",
        },
        about: profile.about,
        partnerPreferences: {
            ageRange: { min: profile.age - 3, max: profile.age + 5 },
            heightRange: { min: gender === "male" ? 150 : 165, max: gender === "male" ? 170 : 185 },
            maritalStatus: ["never_married"],
            religion: [profile.religion.toLowerCase()],
            education: ["bachelors", "masters"],
        },
        wallet: {
            balance: 100,
            transactions: [{
                type: "credit",
                amount: 100,
                description: "Welcome bonus",
                createdAt: new Date(),
            }],
            phoneNumbersViewed: [],
        },
        isProfileComplete: true,
        role: "user",
    });

    return user.save();
};

// Main seed function
const seedDatabase = async () => {
    try {
        await connectDB();

        // Delete ALL users
        console.log("🗑️  Deleting ALL existing profiles...");
        const deleteResult = await User.deleteMany({});
        console.log(`   Deleted ${deleteResult.deletedCount} profiles`);

        // Delete ALL admins
        console.log("🗑️  Deleting ALL existing admins...");
        const adminDeleteResult = await Admin.deleteMany({});
        console.log(`   Deleted ${adminDeleteResult.deletedCount} admins`);

        // Create Admin User (as User for profile viewing if needed)
        console.log("👑 Creating admin user profile...");
        const adminUserPassword = await bcrypt.hash("admin123", 12);
        const adminUser = new User({
            phone: "9999999999",
            email: "admin@matrimony.com",
            password: adminUserPassword,
            isPhoneVerified: true,
            isEmailVerified: true,
            role: "admin",
            basicInfo: { name: "Admin User", gender: "male", age: 30, height: 175, weight: 70, maritalStatus: "never_married", city: "Admin City", state: "Admin State" },
            culturalInfo: { religion: "other" },
        });
        await adminUser.save();
        console.log("   ✓ Created: Admin User Profile");

        // Create Real Admin (for Admin Panel Login)
        console.log("👑 Creating real admin account...");
        // Password "admin123" will be hashed by pre-save hook in Admin model
        const admin = new Admin({
            name: "Super Admin",
            email: "admin@matrimony.com",
            password: "admin123",
            role: "super_admin",
            permissions: ["users", "connections", "settings", "analytics", "admins"],
            isActive: true,
        });
        await admin.save();
        console.log("   ✓ Created: Admin Account (Super Admin)");

        // Create male profiles
        console.log("👨 Creating male profiles...");
        for (let i = 0; i < maleProfiles.length; i++) {
            await createUser(maleProfiles[i], "male", i + 1);
            console.log(`   ✓ Created: ${maleProfiles[i].name}`);
        }

        // Create female profiles
        console.log("👩 Creating female profiles...");
        for (let i = 0; i < femaleProfiles.length; i++) {
            await createUser(femaleProfiles[i], "female", i + 1);
            console.log(`   ✓ Created: ${femaleProfiles[i].name}`);
        }

        console.log("\n✅ Database seeded successfully!");
        console.log(`   Total profiles created: ${maleProfiles.length + femaleProfiles.length + 1}`);
        console.log(`   Total admins created: 1`);
        console.log("\n📝 Test credentials:");
        console.log("   User: arjun.sharma@example.com / password123");
        console.log("   Admin: admin@matrimony.com / admin123");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seed error:", error);
        process.exit(1);
    }
};

seedDatabase();
