# Infringement Detection

<cite>
**Referenced Files in This Document**   
- [DetectionsListPage.tsx](file://src/client/pages/modules/eclipse/detections/DetectionsListPage.tsx)
- [InfringementsTable.tsx](file://src/client/pages/modules/eclipse/components/InfringementsTable.tsx)
- [main.py](file://services/engine/main.py)
- [config.py](file://services/engine/config.py)
- [regex_matcher.py](file://services/engine/analyzers/regex_matcher.py)
- [yara_analyzer.py](file://services/engine/analyzers/yara_analyzer.py)
- [ocr_processor.py](file://services/engine/analyzers/ocr_processor.py)
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)
- [base_crawler.py](file://services/engine/crawlers/base_crawler.py)
- [domain_analyzer.py](file://services/engine/analyzers/domain_analyzer.py)
- [types.ts](file://src/core/modules/eclipse/types.ts)
- [operations.ts](file://src/core/modules/eclipse/operations.ts)
- [migration.sql](file://migrations/20251118015752_add_eclipse_module/migration.sql)
- [migration.sql](file://migrations/20251120025530_add_eclipse_complete/migration.sql)
- [migration.sql](file://migrations/20251120052630_add_brand_alert_fields/migration.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Detection System Architecture](#detection-system-architecture)
3. [Data Models](#data-models)
4. [Detection Analysis Process](#detection-analysis-process)
5. [Confidence Scoring and Severity Classification](#confidence-scoring-and-severity-classification)
6. [UI Components for Detection Management](#ui-components-for-detection-management)
7. [Integration with Python Analysis Engine](#integration-with-python-analysis-engine)
8. [False Positive Reduction Strategies](#false-positive-reduction-strategies)
9. [Conclusion](#conclusion)

## Introduction

The Infringement Detection system in the Eclipse module is designed to identify brand violations through comprehensive web crawling and analysis. This system leverages multiple detection techniques including regex pattern matching, OCR (Optical Character Recognition), and YARA rules to identify potential brand infringements across various online sources. The system processes crawl results, creates detections based on confidence thresholds, and manages the lifecycle of brand alerts and infringements through a structured workflow. This documentation provides a detailed overview of the system's architecture, data models, analysis processes, and user interface components.

**Section sources**
- [DetectionsListPage.tsx](file://src/client/pages/modules/eclipse/detections/DetectionsListPage.tsx)
- [InfringementsTable.tsx](file://src/client/pages/modules/eclipse/components/InfringementsTable.tsx)
- [migration.sql](file://migrations/20251118015752_add_eclipse_module/migration.sql)
- [migration.sql](file://migrations/20251120025530_add_eclipse_complete/migration.sql)

## Detection System Architecture

The Infringement Detection system follows a distributed architecture with a Python-based analysis engine that processes monitoring tasks from a Redis queue. The system consists of several key components that work together to identify and process brand violations.

```mermaid
graph TD
A[Brand Monitors] --> B[Redis Queue]
B --> C[Python Analysis Engine]
C --> D[Web Crawler]
D --> E[Content Analysis]
E --> F[Regex Matcher]
E --> G[YARA Analyzer]
E --> H[OCR Processor]
E --> I[Domain Analyzer]
F --> J[Detection Creation]
G --> J
H --> J
I --> J
J --> K[BrandAlert]
K --> L[BrandInfringement]
L --> M[UI Components]
M --> N[Detection Review]
N --> O[Triage & Action]
```

**Diagram sources**
- [main.py](file://services/engine/main.py)
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)
- [regex_matcher.py](file://services/engine/analyzers/regex_matcher.py)
- [yara_analyzer.py](file://services/engine/analyzers/yara_analyzer.py)
- [ocr_processor.py](file://services/engine/analyzers/ocr_processor.py)
- [domain_analyzer.py](file://services/engine/analyzers/domain_analyzer.py)

The system begins with brand monitors that define the parameters for detecting brand violations. These monitors are configured with search terms, regex patterns, YARA rules, and other detection criteria. When a monitor is activated, it creates a task that is placed in a Redis queue. The Python analysis engine, running as a separate service, consumes these tasks and processes them using a web crawler that navigates to target URLs and captures content.

The captured content is then analyzed using multiple techniques: regex matching for pattern detection, YARA rules for advanced pattern matching, OCR for extracting text from images, and domain analysis for identifying suspicious domain patterns. The results from these analyses are combined to calculate a confidence score, which determines whether a detection should be created.

**Section sources**
- [main.py](file://services/engine/main.py)
- [config.py](file://services/engine/config.py)
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)
- [base_crawler.py](file://services/engine/crawlers/base_crawler.py)

## Data Models

The Infringement Detection system utilizes several key data models to represent brands, monitors, alerts, and infringements. These models are defined in the database schema and are used throughout the application.

### BrandInfringement Data Model

The `BrandInfringement` model represents a confirmed brand violation and contains detailed information about the infringement:

```mermaid
classDiagram
class BrandInfringement {
+id : string
+createdAt : DateTime
+updatedAt : DateTime
+brandId : string
+workspaceId : string
+title : string
+description : string
+detectionDate : DateTime
+url : string
+domain : string
+ipAddress : string
+location : string
+type : string
+severity : string
+status : string
+notes : string[]
+detectedBy : string
+investigatedBy : string
+resolvedAt : DateTime
+aegisIncidentId : string
+aegisSyncStatus : string
+aegisSyncedAt : DateTime
+aegisSyncError : string
}
```

**Diagram sources**
- [migration.sql](file://migrations/20251120025530_add_eclipse_complete/migration.sql)
- [types.ts](file://src/core/modules/eclipse/types.ts)

### BrandAlert Data Model

The `BrandAlert` model represents a potential brand violation that requires review:

```mermaid
classDiagram
class BrandAlert {
+id : string
+createdAt : DateTime
+updatedAt : DateTime
+monitorId : string
+brandId : string
+workspaceId : string
+title : string
+description : string
+url : string
+severity : string
+status : string
+infringementId : string
+sourceData : JSONB
+confidence : integer
+alertMetadata : JSONB
+analysisData : JSONB
+content : string
+detectionType : string
+screenshotUrl : string
}
```

**Diagram sources**
- [migration.sql](file://migrations/20251120025530_add_eclipse_complete/migration.sql)
- [migration.sql](file://migrations/20251120052630_add_brand_alert_fields/migration.sql)
- [types.ts](file://src/core/modules/eclipse/types.ts)

### BrandMonitor Data Model

The `BrandMonitor` model defines the parameters for detecting brand violations:

```mermaid
classDiagram
class BrandMonitor {
+id : string
+createdAt : DateTime
+updatedAt : DateTime
+brandId : string
+workspaceId : string
+monitoringType : string
+source : string
+searchTerms : string[]
+excludeTerms : string[]
+keywords : string[]
+targetRegions : string[]
+targetLanguages : string[]
+excludeRegions : string[]
+yaraRules : string
+regexPatterns : string[]
+domainPatterns : string[]
+confidenceThreshold : integer
+matchingRulesNeeded : integer
+status : string
+isAutomated : boolean
+enableScreenshots : boolean
+enableOCR : boolean
+deepAnalysis : boolean
+checkFrequency : string
+lastCheckAt : DateTime
+nextCheckAt : DateTime
+detectionsThisMonth : integer
+detectionsTotalTime : integer
+successfulRuns : integer
+failedRuns : integer
+lastErrorMessage : string
}
```

**Diagram sources**
- [migration.sql](file://migrations/20251120025530_add_eclipse_complete/migration.sql)
- [types.ts](file://src/core/modules/eclipse/types.ts)

These data models are interconnected, with BrandMonitors generating BrandAlerts when potential violations are detected, and BrandAlerts potentially being escalated to BrandInfringements when violations are confirmed.

**Section sources**
- [migration.sql](file://migrations/20251118015752_add_eclipse_module/migration.sql)
- [migration.sql](file://migrations/20251120025530_add_eclipse_complete/migration.sql)
- [types.ts](file://src/core/modules/eclipse/types.ts)

## Detection Analysis Process

The detection analysis process begins when a BrandMonitor task is processed by the Python analysis engine. The engine uses a web crawler to navigate to target URLs and capture content, which is then analyzed using multiple techniques to identify potential brand violations.

### Crawl and Content Extraction

The web crawler, implemented using Playwright, navigates to the target URL and captures the page content, title, and metadata. It also takes a screenshot of the page, which can be used for OCR analysis. The crawler is configured with timeout settings and can run in headless mode for improved performance.

```mermaid
flowchart TD
A[Start Crawl] --> B{URL Valid?}
B --> |Yes| C[Navigate to URL]
B --> |No| D[Return Error]
C --> E{Page Load Success?}
E --> |Yes| F[Extract Title and Content]
E --> |No| G[Return Timeout Error]
F --> H[Take Screenshot]
H --> I[Extract Metadata]
I --> J[Analyze Content]
J --> K[Calculate Confidence]
K --> L{Confidence >= Threshold?}
L --> |Yes| M[Create Detection]
L --> |No| N[Discard]
```

**Diagram sources**
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)
- [main.py](file://services/engine/main.py)

### Regex Pattern Matching

The regex matcher analyzes the page content and title for matches against predefined patterns. Each pattern is compiled into a regular expression with case-insensitive and multiline flags. The matcher searches for matches in both the title and content, and returns detailed information about each match.

```python
# Example of regex matching process
patterns = [re.compile(pattern, re.IGNORECASE | re.MULTILINE) for pattern in regex_patterns]
for pattern in patterns:
    found = pattern.findall(content)
    if found:
        matches.append({
            'pattern': str(pattern),
            'matches': list(set(found))[:10],
            'count': len(found)
        })
```

**Section sources**
- [regex_matcher.py](file://services/engine/analyzers/regex_matcher.py)
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)

### YARA Rule Analysis

The YARA analyzer applies YARA rules to the page content for advanced pattern detection. YARA rules are compiled at initialization and applied to the content to identify complex patterns that may indicate brand violations. The analyzer returns detailed information about each rule match, including the rule name, namespace, tags, and matched strings.

```python
# Example of YARA analysis process
if self.rules:
    matches = self.rules.match(data=content)
    for match in matches:
        match_info = {
            'rule': match.rule,
            'namespace': match.namespace,
            'tags': match.tags,
            'strings': []
        }
        for string_match in match.strings:
            match_info['strings'].append({
                'identifier': string_match.identifier,
                'instances': len(string_match.instances)
            })
        results.append(match_info)
```

**Section sources**
- [yara_analyzer.py](file://services/engine/analyzers/yara_analyzer.py)
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)

### OCR Processing

The OCR processor extracts text from the screenshot using Tesseract OCR. It analyzes the extracted text for matches against brand keywords and calculates a confidence score based on the quality of the OCR results. The processor can search for specific terms in the extracted text and return their positions and frequency.

```python
# Example of OCR processing
data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
confidences = [
    float(conf) for conf, text in zip(data['conf'], data['text'])
    if conf != -1 and text.strip()
]
avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
text = pytesseract.image_to_string(image)
```

**Section sources**
- [ocr_processor.py](file://services/engine/analyzers/ocr_processor.py)
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)

### Domain Analysis

The domain analyzer checks the URL against predefined domain patterns to identify suspicious domains that may be involved in brand violations. It uses wildcard patterns that are converted to regular expressions for matching. The analyzer can also detect typosquatting by checking for character substitutions and extra characters in the domain name.

```python
# Example of domain pattern matching
for pattern in domain_patterns:
    regex_pattern = pattern.replace('.', r'\.').replace('*', '.*')
    compiled = re.compile(regex_pattern, re.IGNORECASE)
    if compiled.match(domain):
        matches.append({
            'pattern': pattern,
            'domain': domain,
            'url': url
        })
```

**Section sources**
- [domain_analyzer.py](file://services/engine/analyzers/domain_analyzer.py)
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)

## Confidence Scoring and Severity Classification

The system uses a sophisticated confidence scoring mechanism to determine the likelihood of a brand violation. The confidence score is calculated based on the results of multiple analysis techniques, with different weights assigned to each type of match.

### Confidence Calculation

The confidence score is calculated on a scale of 0-100 based on the following criteria:

- Regex matches: +40 points if found
- YARA matches: +15 points if found
- Domain pattern match: +10 points if found
- OCR confirmation: +40 points if found
- Perfect cross-validation bonus: +20 points if both regex and OCR confirm

```mermaid
flowchart TD
A[Start] --> B[Check Regex Matches]
B --> C{Regex Found?}
C --> |Yes| D[Add 40 Points]
C --> |No| E[Add 0 Points]
D --> F[Check YARA Matches]
E --> F
F --> G{YARA Found?}
G --> |Yes| H[Add 15 Points]
G --> |No| I[Add 0 Points]
H --> J[Check Domain Matches]
I --> J
J --> K{Domain Found?}
K --> |Yes| L[Add 10 Points]
K --> |No| M[Add 0 Points]
L --> N[Check OCR Confirmation]
M --> N
N --> O{OCR Found?}
O --> |Yes| P[Add 40 Points]
O --> |No| Q[Add 0 Points]
P --> R{Regex and OCR Both Found?}
Q --> R
R --> |Yes| S[Add 20 Points]
R --> |No| T[Add 0 Points]
S --> U[Calculate Final Score]
T --> U
U --> V[Return Score]
```

**Diagram sources**
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)
- [base_crawler.py](file://services/engine/crawlers/base_crawler.py)

### Severity Classification

The severity of a detection is determined based on the confidence score and the types of matches found. The system uses the following classification:

- Critical: Confidence >= 90 and YARA matches
- High: Confidence >= 75 and multiple match types
- Medium: Confidence >= 50
- Low: Below threshold

```python
def determine_severity(confidence: int, matches: Dict[str, Any]) -> str:
    # Critical: High confidence + Yara matches
    if confidence >= 90 and matches.get('yara'):
        return 'critical'
    
    # High: High confidence or multiple match types
    if confidence >= 75:
        match_types = sum([
            bool(matches.get('regex')),
            bool(matches.get('yara')),
            bool(matches.get('domain')),
            bool(matches.get('ocr'))
        ])
        if match_types >= 2:
            return 'high'
    
    # Medium: Moderate confidence
    if confidence >= 50:
        return 'medium'
    
    # Low: Below threshold
    return 'low'
```

**Section sources**
- [base_crawler.py](file://services/engine/crawlers/base_crawler.py)
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)

## UI Components for Detection Management

The Eclipse module provides several UI components for reviewing and triaging detections, allowing users to efficiently manage brand violations.

### DetectionsListPage Component

The `DetectionsListPage` component displays a list of all detections with filtering options by status and severity. It provides a comprehensive view of all potential brand violations, allowing users to quickly identify and prioritize high-severity detections.

```mermaid
classDiagram
class DetectionsListPage {
+getSeverityColor(severity : string) : string
+getStatusColor(status : string) : string
+render() : JSX.Element
}
```

The component includes filters for status (New, Investigated, Resolved) and severity (Critical, High, Medium, Low), allowing users to focus on specific types of detections. Each detection is displayed with its title, description, confidence score, creation date, and URL. Users can click on a detection to view more details.

**Diagram sources**
- [DetectionsListPage.tsx](file://src/client/pages/modules/eclipse/detections/DetectionsListPage.tsx)

### InfringementsTable Component

The `InfringementsTable` component displays a table of brand infringements with detailed information and action options. It supports bulk operations and provides quick access to infringement details.

```mermaid
classDiagram
class InfringementsTable {
+getSeverityColor(severity : string) : string
+getStatusColor(status : string) : string
+getTypeColor(type : string) : string
+getSeverityLabel(severity : string) : string
+getStatusLabel(status : string) : string
+getTypeLabel(type : string) : string
+render() : JSX.Element
}
```

The table includes columns for title, type, severity, status, brand, and detection date. Each row has a dropdown menu with actions such as View, Edit, and Delete. The component supports selection of multiple infringements for bulk operations.

**Diagram sources**
- [InfringementsTable.tsx](file://src/client/pages/modules/eclipse/components/InfringementsTable.tsx)

Both components are designed to provide an intuitive interface for managing detections and infringements, with visual indicators for severity and status to help users quickly assess the importance of each item.

**Section sources**
- [DetectionsListPage.tsx](file://src/client/pages/modules/eclipse/detections/DetectionsListPage.tsx)
- [InfringementsTable.tsx](file://src/client/pages/modules/eclipse/components/InfringementsTable.tsx)

## Integration with Python Analysis Engine

The Infringement Detection system integrates with a Python analysis engine that performs the heavy lifting of web crawling and content analysis. This engine runs as a separate service and communicates with the main application through a Redis queue.

### Task Processing Workflow

The integration follows a producer-consumer pattern, where the main application creates monitoring tasks and places them in a Redis queue, and the Python engine consumes these tasks and processes them.

```mermaid
sequenceDiagram
participant UI as Web Interface
participant API as Backend API
participant Redis as Redis Queue
participant Engine as Python Engine
UI->>API : Create/Update Monitor
API->>Redis : Enqueue Monitoring Task
Redis->>Engine : Task Available
Engine->>Engine : Process Task
Engine->>Engine : Crawl URL
Engine->>Engine : Analyze Content
Engine->>Engine : Calculate Confidence
Engine->>API : Create Detection (if threshold met)
API->>UI : Real-time Update
```

**Diagram sources**
- [main.py](file://services/engine/main.py)
- [operations.ts](file://src/core/modules/eclipse/operations.ts)
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)

### Configuration and Settings

The Python engine is configured through environment variables that control various aspects of its behavior:

- Redis connection settings
- Database connection settings
- Crawler timeout and concurrency settings
- Playwright configuration (headless mode, screenshot directory)
- OCR language settings
- Logging configuration
- S3/MinIO storage settings

```python
# Example configuration from config.py
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://sentineliq:sentineliq@localhost:5432/sentineliq')
CRAWLER_TIMEOUT = int(os.getenv('SENTINEL_CRAWLER_TIMEOUT', '30000'))
PLAYWRIGHT_HEADLESS = os.getenv('SENTINEL_PLAYWRIGHT_HEADLESS', 'true').lower() == 'true'
TESSERACT_LANG = os.getenv('SENTINEL_TESSERACT_LANG', 'eng+por')
```

The engine also supports integration with external services such as Sentry for error monitoring and ELK stack for centralized logging.

**Section sources**
- [main.py](file://services/engine/main.py)
- [config.py](file://services/engine/config.py)

## False Positive Reduction Strategies

The Infringement Detection system employs several strategies to reduce false positives and improve detection accuracy.

### Confidence Thresholding

The primary mechanism for reducing false positives is the confidence threshold. Each BrandMonitor has a configurable confidence threshold (default 70%) that must be met before a detection is created. This ensures that only high-confidence matches are reported as potential violations.

```python
# Example of confidence thresholding
confidence_threshold = task.get('confidenceThreshold', 70)
if result.confidence >= confidence_threshold:
    # Create alert
else:
    logger.info(f"No alert created - confidence {result.confidence:.2f} below threshold {confidence_threshold}")
```

**Section sources**
- [main.py](file://services/engine/main.py)
- [web_crawler.py](file://services/engine/crawlers/web_crawler.py)

### Multiple Detection Methods

The system uses multiple detection methods (regex, YARA, OCR, domain analysis) and requires cross-validation between methods to achieve high confidence scores. This reduces false positives by ensuring that potential violations are detected by multiple independent methods.

### Exclude Terms

BrandMonitors can be configured with exclude terms that prevent detections on URLs containing specific keywords. This helps filter out legitimate uses of brand terms in contexts that are not violations.

```python
def should_process_url(self, url: str) -> bool:
    url_lower = url.lower()
    for term in self.exclude_terms:
        if term.lower() in url_lower:
            logger.debug(f"Skipping URL (exclude term '{term}'): {url}")
            return False
    return True
```

**Section sources**
- [base_crawler.py](file://services/engine/crawlers/base_crawler.py)

### Rule Tuning

The system allows for fine-tuning of detection rules through:

- Regex pattern refinement
- YARA rule optimization
- Domain pattern adjustment
- OCR keyword selection
- Confidence threshold adjustment

These tuning options allow users to adapt the detection system to their specific needs and reduce false positives over time.

## Conclusion

The Infringement Detection system in the Eclipse module provides a comprehensive solution for identifying and managing brand violations. By combining multiple analysis techniques including regex matching, YARA rules, OCR, and domain analysis, the system achieves high detection accuracy while minimizing false positives. The integration with a Python analysis engine allows for scalable processing of monitoring tasks, while the intuitive UI components enable efficient review and triage of detections. The system's confidence scoring and severity classification mechanisms help prioritize the most critical violations, and the configurable rules and thresholds allow for fine-tuning to specific use cases. Overall, this system provides a robust foundation for protecting brand integrity in the digital landscape.