const express = require("express");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Cost to view a phone number (in coins)
const VIEW_PHONE_COST = 10;

/**
 * @route   GET /api/wallet/balance
 * @desc    Get current wallet balance
 * @access  Private
 */
router.get("/balance", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("wallet.balance");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            data: {
                balance: user.wallet?.balance || 0,
                viewPhoneCost: VIEW_PHONE_COST,
            },
        });
    } catch (error) {
        console.error("Get balance error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching balance",
        });
    }
});

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get transaction history
 * @access  Private
 */
router.get("/transactions", auth, async (req, res) => {
    try {
        const { limit = 20, skip = 0 } = req.query;

        const user = await User.findById(req.user.id)
            .select("wallet.transactions")
            .populate("wallet.transactions.relatedUserId", "basicInfo.name profilePhoto");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Sort transactions by date (newest first)
        const transactions = (user.wallet?.transactions || [])
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(parseInt(skip), parseInt(skip) + parseInt(limit));

        res.json({
            success: true,
            data: {
                transactions,
                total: user.wallet?.transactions?.length || 0,
            },
        });
    } catch (error) {
        console.error("Get transactions error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching transactions",
        });
    }
});

/**
 * @route   POST /api/wallet/unlock-profile
 * @desc    Use coins to unlock a user's full profile
 * @access  Private
 */
router.post("/unlock-profile", auth, async (req, res) => {
    try {
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: "Target user ID is required",
            });
        }

        if (targetUserId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "Cannot unlock your own profile",
            });
        }

        // Get user wallet
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if already unlocked
        const alreadyUnlocked = user.wallet?.profilesUnlocked?.some(
            (item) => item.userId.toString() === targetUserId
        );

        if (alreadyUnlocked) {
            return res.json({
                success: true,
                message: "Profile already unlocked",
                data: {
                    alreadyUnlocked: true,
                    balance: user.wallet?.balance || 0,
                },
            });
        }

        // Check balance
        const currentBalance = user.wallet?.balance || 0;
        if (currentBalance < VIEW_PHONE_COST) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance",
                data: {
                    currentBalance,
                    required: VIEW_PHONE_COST,
                },
            });
        }

        // Deduct coins and record transaction
        if (!user.wallet) {
            user.wallet = { balance: 0, transactions: [], profilesUnlocked: [] };
        }

        user.wallet.balance -= VIEW_PHONE_COST;
        user.wallet.transactions.push({
            type: "debit",
            amount: VIEW_PHONE_COST,
            description: `Unlocked profile of user ${targetUserId}`,
            relatedUserId: targetUserId,
            createdAt: new Date(),
        });
        user.wallet.profilesUnlocked.push({
            userId: targetUserId,
            unlockedAt: new Date(),
        });

        await user.save();

        res.json({
            success: true,
            message: "Profile unlocked successfully",
            data: {
                coinsUsed: VIEW_PHONE_COST,
                balance: user.wallet.balance,
            },
        });
    } catch (error) {
        console.error("Unlock profile error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while unlocking profile",
        });
    }
});

/**
 * @route   GET /api/wallet/profiles-unlocked
 * @desc    Get list of profiles unlocked
 * @access  Private
 */
router.get("/profiles-unlocked", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("wallet.profilesUnlocked")
            .populate("wallet.profilesUnlocked.userId", "basicInfo.name profilePhoto");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            data: {
                unlockedProfiles: user.wallet?.profilesUnlocked || [],
            },
        });
    } catch (error) {
        console.error("Get unlocked profiles error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching unlocked profiles",
        });
    }
});

/**
 * @route   POST /api/wallet/add-credits (Admin only - for future use)
 * @desc    Add credits to a user's wallet
 * @access  Private (should be admin protected in production)
 */
router.post("/add-credits", auth, async (req, res) => {
    try {
        const { amount, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required",
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.wallet) {
            user.wallet = { balance: 0, transactions: [], phoneNumbersViewed: [] };
        }

        user.wallet.balance += amount;
        user.wallet.transactions.push({
            type: "credit",
            amount,
            description: description || "Credits added",
            createdAt: new Date(),
        });

        await user.save();

        res.json({
            success: true,
            message: "Credits added successfully",
            data: {
                creditsAdded: amount,
                newBalance: user.wallet.balance,
            },
        });
    } catch (error) {
        console.error("Add credits error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while adding credits",
        });
    }
});

module.exports = router;
