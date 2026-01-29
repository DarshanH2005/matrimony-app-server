const express = require("express");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/connection/send
 * @desc    Send a connection request to another user
 * @access  Private
 */
router.post("/send", auth, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    // Validation
    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: "Cannot send request to yourself",
      });
    }

    // Get both users
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!receiver.isActive) {
      return res.status(400).json({
        success: false,
        message: "This user is no longer active",
      });
    }

    // Check if request already exists
    const existingRequest = sender.connectionRequests.find(
      (req) => req.userId.toString() === receiverId,
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: `Connection request already ${existingRequest.status}`,
      });
    }

    // Add request to sender (as sent)
    sender.connectionRequests.push({
      userId: receiverId,
      status: "pending",
      type: "sent",
      message: message || "",
      createdAt: new Date(),
    });

    // Add request to receiver (as received)
    receiver.connectionRequests.push({
      userId: senderId,
      status: "pending",
      type: "received",
      message: message || "",
      createdAt: new Date(),
    });

    await Promise.all([sender.save(), receiver.save()]);

    res.status(201).json({
      success: true,
      message: "Connection request sent successfully",
      data: {
        receiverId,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Send connection error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending connection request",
    });
  }
});

/**
 * @route   PUT /api/connection/respond
 * @desc    Accept or reject a connection request
 * @access  Private
 */
router.put("/respond", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { requesterId, action } = req.body;

    // Validation
    if (!requesterId) {
      return res.status(400).json({
        success: false,
        message: "Requester ID is required",
      });
    }

    if (!["accept", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "accept" or "reject"',
      });
    }

    const newStatus = action === "accept" ? "accepted" : "rejected";

    // Get both users
    const [user, requester] = await Promise.all([
      User.findById(userId),
      User.findById(requesterId),
    ]);

    if (!user || !requester) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find the request in user's connectionRequests
    const userRequest = user.connectionRequests.find(
      (req) => req.userId.toString() === requesterId && req.type === "received",
    );

    if (!userRequest) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    if (userRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request has already been ${userRequest.status}`,
      });
    }

    // Update status for both users
    userRequest.status = newStatus;
    userRequest.respondedAt = new Date();

    const requesterRequest = requester.connectionRequests.find(
      (req) => req.userId.toString() === userId && req.type === "sent",
    );

    if (requesterRequest) {
      requesterRequest.status = newStatus;
      requesterRequest.respondedAt = new Date();
    }

    await Promise.all([user.save(), requester.save()]);

    res.json({
      success: true,
      message: `Connection request ${newStatus}`,
      data: {
        requesterId,
        status: newStatus,
      },
    });
  } catch (error) {
    console.error("Respond connection error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while responding to connection request",
    });
  }
});

/**
 * @route   GET /api/connection/requests
 * @desc    Get all connection requests (sent and received)
 * @access  Private
 */
router.get("/requests", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status } = req.query;

    const user = await User.findById(userId).populate(
      "connectionRequests.userId",
      "basicInfo profilePhoto careerInfo",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let requests = user.connectionRequests || [];

    // Filter by type if specified
    if (type && ["sent", "received"].includes(type)) {
      requests = requests.filter((req) => req.type === type);
    }

    // Filter by status if specified
    if (status && ["pending", "accepted", "rejected"].includes(status)) {
      requests = requests.filter((req) => req.status === status);
    }

    // Sort by createdAt (newest first)
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        requests,
        counts: {
          total: user.connectionRequests.length,
          pending: user.connectionRequests.filter((r) => r.status === "pending")
            .length,
          accepted: user.connectionRequests.filter(
            (r) => r.status === "accepted",
          ).length,
          rejected: user.connectionRequests.filter(
            (r) => r.status === "rejected",
          ).length,
        },
      },
    });
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching connection requests",
    });
  }
});

/**
 * @route   GET /api/connection/matches
 * @desc    Get all accepted connections (matches)
 * @access  Private
 */
router.get("/matches", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate({
      path: "connectionRequests.userId",
      select: "basicInfo profilePhoto careerInfo culturalInfo lastActive",
      match: { isActive: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Filter only accepted connections
    const matches = user.connectionRequests
      .filter((req) => req.status === "accepted" && req.userId)
      .map((req) => ({
        user: req.userId,
        connectedAt: req.respondedAt || req.createdAt,
        initiatedBy: req.type === "sent" ? "me" : "them",
      }));

    // Sort by connection date (newest first)
    matches.sort((a, b) => new Date(b.connectedAt) - new Date(a.connectedAt));

    res.json({
      success: true,
      data: {
        matches,
        totalMatches: matches.length,
      },
    });
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching matches",
    });
  }
});

/**
 * @route   GET /api/connection/all
 * @desc    Get all connections (pending requests + accepted matches) - for Connections tab
 * @access  Private
 */
router.get("/all", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate({
      path: "connectionRequests.userId",
      select: "basicInfo profilePhoto careerInfo culturalInfo lastActive",
      match: { isActive: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get pending received requests (these are what the user needs to respond to)
    const pending = user.connectionRequests
      .filter(
        (req) =>
          req.status === "pending" && req.type === "received" && req.userId,
      )
      .map((req) => ({
        _id: req._id,
        user: req.userId,
        message: req.message,
        createdAt: req.createdAt,
      }));

    // Get accepted connections
    const accepted = user.connectionRequests
      .filter((req) => req.status === "accepted" && req.userId)
      .map((req) => ({
        _id: req._id,
        user: req.userId,
        connectedAt: req.respondedAt || req.createdAt,
        initiatedBy: req.type === "sent" ? "me" : "them",
      }));

    // Sort by date (newest first)
    pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    accepted.sort((a, b) => new Date(b.connectedAt) - new Date(a.connectedAt));

    res.json({
      success: true,
      data: {
        pending,
        accepted,
        counts: {
          pending: pending.length,
          accepted: accepted.length,
        },
      },
    });
  } catch (error) {
    console.error("Get all connections error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching connections",
    });
  }
});

/**
 * @route   DELETE /api/connection/:userId
 * @desc    Remove a connection
 * @access  Private
 */
router.delete("/:userId", auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove from current user
    currentUser.connectionRequests = currentUser.connectionRequests.filter(
      (req) => req.userId.toString() !== targetUserId,
    );

    // Remove from target user
    targetUser.connectionRequests = targetUser.connectionRequests.filter(
      (req) => req.userId.toString() !== currentUserId,
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      message: "Connection removed successfully",
    });
  } catch (error) {
    console.error("Remove connection error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing connection",
    });
  }
});

module.exports = router;
