/**
 * Streaming API Client for TradeWatch
 * Connects React frontend to TensorFlow AI processing system
 */

class StreamingAPIClient {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
        this.eventSources = new Map();
        this.listeners = new Map();
    }

    /**
     * Get live streaming data
     */
    async getLiveStreamingData() {
        try {
            const response = await fetch(`${this.baseURL}/streaming/live-data`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching live streaming data:', error);
            return { live_data: {}, timestamp: new Date().toISOString(), data_counts: {} };
        }
    }

    /**
     * Get streaming statistics
     */
    async getStreamingStatistics() {
        try {
            const response = await fetch(`${this.baseURL}/streaming/statistics`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching streaming statistics:', error);
            return { ingestion_statistics: {}, timestamp: new Date().toISOString() };
        }
    }

    /**
     * Get recent vessels for real-time map updates
     */
    async getRecentVessels(limit = 100) {
        try {
            const response = await fetch(`${this.baseURL}/data/recent-vessels?limit=${limit}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Transform data for compatibility with existing code
            return data.vessels.map(vessel => ({
                id: vessel.vessel_id,
                latitude: vessel.latitude,
                longitude: vessel.longitude,
                speed: vessel.speed_knots,
                heading: vessel.heading_degrees,
                timestamp: vessel.timestamp,
                source: vessel.data_source || 'AI_Stream',
                type: 'real_time'
            }));
        } catch (error) {
            console.error('Error fetching recent vessels:', error);
            return [];
        }
    }

    /**
     * Get active alerts and disruptions
     */
    async getActiveAlerts(severity = 'all') {
        try {
            const response = await fetch(`${this.baseURL}/data/active-alerts?severity=${severity}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            // Transform data for compatibility with existing code
            return data.alerts.map(alert => ({
                id: alert.disruption_id,
                type: alert.event_type,
                title: alert.title,
                severity: this.mapSeverityLevel(alert.severity_level),
                startDate: alert.start_date,
                probability: alert.probability,
                confidence: alert.confidence_score,
                aiGenerated: alert.ai_generated,
                source: 'AI_Detection'
            }));
        } catch (error) {
            console.error('Error fetching active alerts:', error);
            return [];
        }
    }

    /**
     * Get vessel movement predictions
     */
    async getVesselPredictions(vesselData, predictionHours = 24) {
        try {
            const response = await fetch(`${this.baseURL}/predict/vessel-movement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vessel_data: vesselData,
                    prediction_horizon_hours: predictionHours,
                    include_weather: true,
                    include_economic_factors: true
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting vessel predictions:', error);
            return [];
        }
    }

    /**
     * Detect disruptions using AI
     */
    async detectDisruptions(newsData = [], vesselAnomalies = [], economicIndicators = []) {
        try {
            const response = await fetch(`${this.baseURL}/detect/disruptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    news_data: newsData,
                    vessel_anomalies: vesselAnomalies,
                    economic_indicators: economicIndicators
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error detecting disruptions:', error);
            return [];
        }
    }

    /**
     * Get AI performance analytics
     */
    async getPerformanceAnalytics() {
        try {
            const response = await fetch(`${this.baseURL}/analytics/performance`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching performance analytics:', error);
            return { 
                model_performance: {}, 
                data_pipeline_stats: {}, 
                system_resources: {},
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Trigger immediate AI model training
     */
    async triggerModelTraining(modelType = 'all') {
        try {
            const response = await fetch(`${this.baseURL}/training/trigger-immediate?model_type=${modelType}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error triggering model training:', error);
            return { message: 'Training trigger failed', timestamp: new Date().toISOString() };
        }
    }

    /**
     * Restart a specific data stream
     */
    async restartStream(streamName) {
        try {
            const response = await fetch(`${this.baseURL}/streaming/restart-stream?stream_name=${streamName}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error restarting stream:', error);
            return { message: 'Stream restart failed', timestamp: new Date().toISOString() };
        }
    }

    /**
     * Set up real-time data polling
     */
    startRealTimePolling(callback, interval = 30000) {
        const pollData = async () => {
            try {
                const [liveData, vessels, alerts, analytics] = await Promise.all([
                    this.getLiveStreamingData(),
                    this.getRecentVessels(50),
                    this.getActiveAlerts('medium'),
                    this.getStreamingStatistics()
                ]);

                callback({
                    liveData,
                    vessels,
                    alerts,
                    analytics,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error in real-time polling:', error);
            }
        };

        // Initial call
        pollData();

        // Set up interval
        const intervalId = setInterval(pollData, interval);

        // Return cleanup function
        return () => clearInterval(intervalId);
    }

    /**
     * Set up WebSocket connection for real-time updates
     */
    connectWebSocket(onMessage, onError = null) {
        try {
            const wsURL = this.baseURL.replace('http', 'ws') + '/ws/real-time';
            const ws = new WebSocket(wsURL);

            ws.onopen = () => {
                console.log('WebSocket connected to AI processing system');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                if (onError) onError(error);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                // Attempt reconnection after 5 seconds
                setTimeout(() => {
                    console.log('Attempting WebSocket reconnection...');
                    this.connectWebSocket(onMessage, onError);
                }, 5000);
            };

            return ws;
        } catch (error) {
            console.error('Error connecting WebSocket:', error);
            return null;
        }
    }

    /**
     * Helper method to map severity levels
     */
    mapSeverityLevel(level) {
        const severityMap = {
            1: 'low',
            2: 'medium', 
            3: 'high',
            4: 'critical',
            5: 'extreme'
        };
        return severityMap[level] || 'medium';
    }

    /**
     * Check if AI processing system is available
     */
    async isSystemAvailable() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get comprehensive system status
     */
    async getSystemStatus() {
        try {
            const [health, analytics, streaming] = await Promise.all([
                fetch(`${this.baseURL}/health`).then(r => r.json()),
                this.getPerformanceAnalytics(),
                this.getStreamingStatistics()
            ]);

            return {
                healthy: true,
                health,
                analytics,
                streaming,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting system status:', error);
            return {
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Create singleton instance
const streamingClient = new StreamingAPIClient();

export default streamingClient;

// Named exports for specific functions
export {
    StreamingAPIClient
};
