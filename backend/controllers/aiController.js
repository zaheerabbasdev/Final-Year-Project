const AIService = require('../services/aiService');

const getMatchingJobs = async (req, res) => {
    try {
        const providerId = req.user.id;
        const jobs = await AIService.getSmartMatchingJobs(providerId);
        res.json(jobs);
    } catch (error) {
        console.error("Error in getMatchingJobs controller:", error);
        res.status(500).json({ message: "Error running smart job-provider match algorithm" });
    }
};

const getSuggestedBid = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const suggestion = await AIService.getBidPriceSuggestion(jobId);
        if (!suggestion) {
            return res.status(404).json({ message: "Job not found" });
        }
        res.json(suggestion);
    } catch (error) {
        console.error("Error in getSuggestedBid controller:", error);
        res.status(500).json({ message: "Error suggesting bid price" });
    }
};

const getFraudReviews = async (req, res) => {
    try {
        const fraudLogs = await AIService.detectReviewFraud();
        res.json(fraudLogs);
    } catch (error) {
        console.error("Error in getFraudReviews controller:", error);
        res.status(500).json({ message: "Error running fraud/anomaly detection algorithm" });
    }
};

const getAutocomplete = async (req, res) => {
    try {
        const { partialDescription } = req.body;
        const result = await AIService.autocompleteJobDescription(partialDescription);
        res.json(result);
    } catch (error) {
        console.error("Error in getAutocomplete controller:", error);
        res.status(500).json({ message: "Error autocomplete recommendation" });
    }
};

const supportChatbot = async (req, res) => {
    try {
        const { message, history } = req.body;
        const responseText = await AIService.supportChatbot(message, history || []);
        res.json({ response: responseText });
    } catch (error) {
        console.error("Error in supportChatbot controller:", error);
        res.status(500).json({ message: "Error getting bot support response" });
    }
};

module.exports = {
    getMatchingJobs,
    getSuggestedBid,
    getFraudReviews,
    getAutocomplete,
    supportChatbot
};
