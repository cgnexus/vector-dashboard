# AI-Powered Cost Tracking and Anomaly Detection

This module provides advanced AI capabilities for the Nexus dashboard, focusing on intelligent cost tracking, usage pattern analysis, and anomaly detection for API management.

## Features

### 🧮 Cost Calculation Engine (`cost-calculator.ts`)
- **Real-time cost calculation** for all supported API providers
- **Multi-provider pricing support**:
  - OpenAI (GPT-4, GPT-3.5, embeddings, DALL-E, Whisper, TTS)
  - OpenRouter (Claude, Llama, Mistral, Gemini)
  - Exa API (search, contents, similarity)
  - Twilio (SMS, voice, email, WhatsApp)
  - Apollo (enrichment, search, export)
- **Usage pattern analysis** for cost prediction
- **Cost optimization recommendations**

### 🔍 Anomaly Detection System (`anomaly-detector.ts`)
- **Statistical anomaly detection** using baseline analysis
- **Multiple anomaly types**:
  - Cost spikes and unusual spending patterns
  - Usage spikes and traffic anomalies
  - Response time degradation
  - Error rate increases
  - Provider outages and service issues
  - Token efficiency drops (for LLM APIs)
- **Confidence scoring** and severity classification
- **Smart alerting** with contextual recommendations

### 📊 Usage Pattern Analyzer (`usage-analyzer.ts`)
- **Trend analysis** across hourly, daily, weekly patterns
- **Usage prediction** with confidence intervals
- **Cross-API correlation analysis**
- **Seasonality detection** and pattern recognition
- **Performance optimization insights**

### 💰 Cost Optimization Engine (`cost-optimizer.ts`)
- **Model optimization strategies** (e.g., GPT-4 → GPT-4-turbo)
- **Provider switching recommendations**
- **Batching and caching strategies**
- **Budget allocation optimization**
- **Cost forecasting** with optimization scenarios

## API Endpoints

### GET `/api/ai/insights`
Generate comprehensive dashboard insights including anomalies, patterns, and optimizations.

**Query Parameters:**
- `type`: `full` | `quick` | `optimization`
- `providerId`: Filter by specific provider
- `days`: Number of days to analyze (1-365)

**Response:**
```json
{
  "success": true,
  "insights": {
    "realTimeCosts": {
      "currentCost": 1.23,
      "hourlyRate": 0.05,
      "dailyProjection": 1.20,
      "monthlyProjection": 36.90
    },
    "anomalies": [...],
    "usagePatterns": {...},
    "predictions": {...},
    "optimizations": [...]
  }
}
```

### GET `/api/ai/cost-tracking`
Real-time cost tracking with predictions and optimization opportunities.

**Query Parameters:**
- `timeframe`: `1h` | `24h` | `7d` | `30d`
- `providerId`: Filter by specific provider

### GET `/api/ai/anomalies`
Detect and retrieve anomalies in API usage patterns.

**Query Parameters:**
- `severity`: `low` | `medium` | `high` | `critical`
- `type`: Specific anomaly type
- `limit`: Maximum number of results (1-1000)
- `days`: Analysis period (1-90)

## Usage Examples

### Basic Cost Calculation
```typescript
import { CostCalculator } from '@/lib/ai';

// Calculate cost for a single API call
const cost = CostCalculator.calculateCallCost(metric);

// Get real-time cost projections
const realTimeCosts = CostCalculator.calculateRealTimeCost(metrics);
```

### Anomaly Detection
```typescript
import { AnomalyDetector } from '@/lib/ai';

const detector = new AnomalyDetector({
  costSpikeThreshold: 3.0,
  confidenceThreshold: 0.7
});

const anomalies = await detector.detectAnomalies(metrics);
```

### Usage Pattern Analysis
```typescript
import { UsageAnalyzer } from '@/lib/ai';

// Identify usage patterns
const patterns = UsageAnalyzer.identifyPatterns(metrics);

// Predict future usage
const predictions = UsageAnalyzer.predictUsage(metrics);

// Analyze cross-API correlations
const correlations = UsageAnalyzer.analyzeCrossAPICorrelations(metrics);
```

### Cost Optimization
```typescript
import { CostOptimizer } from '@/lib/ai';

// Generate optimization strategies
const strategies = await CostOptimizer.generateOptimizationStrategies(
  metrics, 
  patterns, 
  correlations
);

// Get model alternatives
const alternatives = CostOptimizer.suggestModelAlternatives(metrics);

// Optimize budget allocation
const allocations = CostOptimizer.optimizeBudgetAllocation(metrics, budgets);
```

### Complete Dashboard Insights
```typescript
import { AIOrchestrator } from '@/lib/ai';

// Generate comprehensive insights
const insights = await AIOrchestrator.generateDashboardInsights(metrics, userId);

// Quick anomaly check for alerts
const quickAnomalies = await AIOrchestrator.quickAnomalyCheck(recentMetrics);

// Calculate optimization potential
const potential = await AIOrchestrator.calculateOptimizationPotential(metrics);
```

## Configuration

### Anomaly Detection Configuration
```typescript
const config = {
  costSpikeThreshold: 3.0,        // Standard deviations above mean
  usageSpikeThreshold: 2.5,       // Standard deviations above mean
  responseTimeThreshold: 2.0,     // Standard deviations above mean
  errorRateThreshold: 20.0,       // Percentage threshold
  minimumDataPoints: 30,          // Minimum samples for analysis
  lookbackHours: 168,             // 7 days lookback
  confidenceThreshold: 0.7        // Minimum confidence to report
};
```

### Provider Pricing Configuration
The cost calculator includes comprehensive pricing for all supported providers. Pricing is automatically updated based on the latest provider rate cards.

## Data Quality Validation

The AI services include built-in data quality validation:

```typescript
import { AIUtils } from '@/lib/ai';

const quality = AIUtils.validateMetricsQuality(metrics);
// Returns: { isValid: boolean, issues: string[], recommendations: string[] }
```

## Performance Considerations

- **Efficient algorithms**: Statistical methods optimized for real-time analysis
- **Configurable thresholds**: Adjust sensitivity based on data volume
- **Incremental processing**: Suitable for streaming data
- **Memory efficient**: Processes large datasets without excessive memory usage

## Security and Privacy

- **No external API calls**: All processing happens locally
- **User data isolation**: Analysis scoped to individual users
- **Secure calculations**: No sensitive data in logs or errors
- **Audit trail**: All insights include metadata for transparency

## Error Handling

The AI services include comprehensive error handling:

- Graceful degradation with partial data
- Fallback to simpler algorithms when needed
- Detailed error logging for debugging
- Safe defaults for edge cases

## Future Enhancements

- **Machine learning models** for improved predictions
- **Custom alert rules** and notification channels
- **Advanced forecasting** with external factors
- **Benchmark comparisons** against industry standards
- **A/B testing recommendations** for optimization strategies

## Contributing

When adding new features:

1. Follow the existing pattern architecture
2. Include comprehensive error handling
3. Add TypeScript types for all interfaces
4. Include unit tests for statistical functions
5. Update this documentation

## Performance Metrics

The AI services are designed for:
- **Analysis latency**: < 200ms for typical datasets
- **Memory usage**: < 100MB for 10K metrics
- **Accuracy**: > 85% for anomaly detection
- **Confidence**: Statistical confidence scores for all insights