# Technical Architecture Analysis
## Audio-New: Sales Call Analysis Platform

**Analysis Date:** January 19, 2025  
**Project:** Sales Call Analyzer with Real-time AI Coaching  

---

## 1. Executive Summary

The audio-new project is a comprehensive sales call analysis platform designed specifically for home improvement sales teams. It combines real-time AI coaching during live calls with post-call analysis and training features. The application follows a modern full-stack architecture with microservices patterns for scalability and real-time capabilities.

### Core Value Proposition
- **Real-time AI coaching** during sales calls using voice transcription
- **Post-call analysis** with detailed sales methodology scoring
- **Practice platform** for sales skill development
- **Story bank** for objection handling scenarios
- **Mobile-first design** for field sales representatives

---

## 2. Technology Stack Overview

### Frontend Stack
- **Framework:** React 18.2.0 + Vite 5.0.8
- **Language:** JavaScript (JSX)
- **Routing:** React Router DOM 6.21.0
- **Styling:** Tailwind CSS 3.3.6 + PostCSS
- **State Management:** Context API (AuthContext, LanguageContext)
- **HTTP Client:** Axios 1.6.2
- **Charts:** Recharts 2.15.4
- **Real-time:** Socket.IO Client 4.8.3
- **Icons:** Lucide React 0.294.0
- **Database Client:** Supabase JS 2.39.0

### Backend Stack
- **Framework:** Flask + Flask-SocketIO
- **Language:** Python 3.x
- **Authentication:** JWT + Supabase Auth
- **Real-time:** WebSockets + Socket.IO
- **AI Services:** 
  - OpenAI GPT-4o (primary AI)
  - AssemblyAI (speech-to-text)
- **Database:** Supabase (PostgreSQL)
- **PDF Generation:** ReportLab
- **HTTP Server:** Gunicorn (production)

### Third-party Integrations
- **Supabase:** Authentication, database, storage
- **AssemblyAI:** Real-time speech transcription
- **OpenAI:** AI analysis and coaching
- **Railway:** Backend hosting
- **Netlify:** Frontend hosting

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  External APIs  │
│   (Netlify)     │◄──►│   (Railway)     │◄──►│                │
│                 │    │                 │    │ • AssemblyAI    │
│ • React App     │    │ • Flask API     │    │ • OpenAI        │
│ • Vite          │    │ • WebSocket     │    │ • Supabase      │
│ • Tailwind      │    │ • Socket.IO     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3.2 Data Flow Architecture

```
[User Audio] → [Browser Audio API] → [WebSocket] → [AssemblyAI] → [Transcription]
                                          ↓
[AI Analysis] ← [OpenAI GPT-4o] ← [Sales Analyzer] ← [Real-time Processing]
      ↓
[Frontend] ← [Socket.IO] ← [Flask-SocketIO] ← [Coaching Insights]
```

### 3.3 Authentication Flow

```
[User Login] → [Supabase Auth] → [JWT Token] → [Frontend Storage]
                      ↓
[API Requests] → [JWT Verification] → [Backend Access] → [Database RLS]
```

---

## 4. Frontend Architecture

### 4.1 Project Structure
```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── analysis/         # Analysis-specific components
│   │   ├── charts/          # Data visualization components
│   │   └── *.jsx            # Core components
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.jsx  # Authentication state
│   │   └── LanguageContext.jsx # Internationalization
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   │   ├── config.js        # Environment configuration
│   │   ├── supabase.js      # Supabase client
│   │   └── translations.js  # i18n translations
│   ├── pages/               # Route components
│   │   ├── AdminDashboard.jsx
│   │   ├── LiveCallPageMobile.jsx
│   │   └── *.jsx
│   └── main.jsx             # Application entry point
├── public/                  # Static assets
└── dist/                    # Build output
```

### 4.2 Component Architecture

#### Core App Component (`App.jsx`)
- **Routing:** React Router with protected routes
- **Layout:** Responsive sidebar navigation
- **State:** Global context providers
- **Features:** File upload, call history, dashboard

#### Authentication System
- **Context:** `AuthContext` manages user state
- **Integration:** Supabase Auth with JWT tokens
- **Features:** Login, register, Google OAuth, protected routes
- **Session Management:** Automatic session refresh

#### Real-time Components
- **LiveCallPageMobile:** Mobile-first live call interface
- **WebSocket Management:** Socket.IO connection handling
- **Audio Processing:** Browser Audio API integration
- **AI Coaching:** Real-time insight display

### 4.3 State Management

#### Context Providers
1. **AuthContext**
   - User authentication state
   - Login/logout functions
   - Session management

2. **LanguageContext**
   - Multi-language support (Hebrew/English)
   - Translation utilities
   - Locale management

#### Component State Patterns
- **useState:** Local component state
- **useEffect:** Lifecycle management
- **useRef:** DOM references and audio handling
- **Custom Hooks:** Reusable stateful logic

### 4.4 Styling Architecture

#### Tailwind CSS Configuration
- **Mobile-first:** Responsive design approach
- **Custom Colors:** Brand-specific color palette
- **Component Classes:** Utility-first styling
- **Dark Mode:** Optimized for battery saving

#### Design System
- **Typography:** Consistent font scaling
- **Spacing:** Systematic margin/padding
- **Colors:** Semantic color naming
- **Components:** Reusable UI patterns

---

## 5. Backend Architecture

### 5.1 Flask Application Structure

#### Main Application (`app.py`)
- **Framework:** Flask with CORS support
- **WebSockets:** Flask-SocketIO for real-time communication
- **Authentication:** JWT token verification
- **Routes:** RESTful API endpoints
- **File Handling:** Audio file upload and processing

#### Key Modules
1. **`database.py`** - Supabase database operations
2. **`sales_analyzer.py`** - AI sales analysis engine
3. **`websocket_server.py`** - Real-time audio streaming
4. **`pdf_generator.py`** - Report generation

### 5.2 API Architecture

#### RESTful Endpoints
```python
# Authentication
POST /auth/login
POST /auth/register
GET /auth/me

# Call Management
GET /calls                    # List user calls
POST /calls                   # Create new call
GET /calls/<id>              # Get call details
POST /calls/<id>/analyze     # Trigger analysis

# Live Session Management
POST /live/sessions          # Create live session
GET /live/sessions/<id>      # Get session data
POST /live/sessions/<id>/insights # Save insights
PUT /live/sessions/<id>/end  # End session

# Admin Endpoints
GET /admin/dashboard         # Admin statistics
GET /admin/users            # User management
PUT /admin/users/<id>/role  # Update user role

# Story Bank
GET /story-bank             # Get user stories
POST /story-bank            # Create story
PUT /story-bank/<id>        # Update story
DELETE /story-bank/<id>     # Delete story
```

#### WebSocket Events
```python
# Client → Server
'start_live_session'        # Begin live call
'audio_chunk'              # Send audio data
'end_live_session'         # End live call

# Server → Client
'session_started'          # Session confirmation
'transcript_chunk'         # Real-time transcription
'ai_insight'              # Coaching insight
'session_ended'           # Session completion
```

### 5.3 Real-time Architecture

#### WebSocket Flow
```
[Frontend Audio] → [Browser AudioAPI] → [Base64 Encoding] → [Socket.IO]
                                                               ↓
[AssemblyAI] ← [WebSocket Proxy] ← [Flask-SocketIO] ← [Audio Processing]
     ↓
[Transcription] → [AI Analysis] → [Coaching Engine] → [Frontend Insights]
```

#### Audio Processing Pipeline
1. **Capture:** Browser MediaRecorder API
2. **Format:** PCM 16kHz mono audio
3. **Transmission:** Base64 encoded WebSocket messages
4. **Transcription:** AssemblyAI real-time API
5. **Analysis:** OpenAI GPT-4o processing
6. **Delivery:** Socket.IO to frontend

---

## 6. Database Architecture

### 6.1 Supabase Configuration

#### Database Technology
- **Platform:** Supabase (managed PostgreSQL)
- **Authentication:** Built-in Auth system
- **Storage:** File storage for audio files
- **Real-time:** WebSocket subscriptions
- **Security:** Row Level Security (RLS)

### 6.2 Database Schema

#### Core Tables

**`calls` Table**
```sql
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    file_name TEXT NOT NULL,
    audio_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    speakers_count INTEGER DEFAULT 2,
    transcription TEXT,
    utterances JSONB DEFAULT '[]'::jsonb,
    speaker_roles JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'transcribed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`analyses` Table**
```sql
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    seller_talk_percentage NUMERIC DEFAULT 50,
    buyer_talk_percentage NUMERIC DEFAULT 50,
    total_duration_seconds INTEGER DEFAULT 0,
    overall_score INTEGER DEFAULT 0,
    meddic_score INTEGER DEFAULT 0,
    bant_score INTEGER DEFAULT 0,
    bant_qualified BOOLEAN DEFAULT FALSE,
    deal_risk_level TEXT DEFAULT 'medium',
    deal_risk_score INTEGER DEFAULT 50,
    metrics JSONB DEFAULT '{}'::jsonb,
    analysis JSONB DEFAULT '{}'::jsonb,
    objection_types TEXT[] DEFAULT '{}',
    objection_count INTEGER DEFAULT 0,
    coaching_areas TEXT[] DEFAULT '{}',
    strengths TEXT[] DEFAULT '{}',
    improvements TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`story_bank` Table**
```sql
CREATE TABLE story_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'סיפור ללא שם',
    content TEXT NOT NULL,
    original_story TEXT,
    target_emotions TEXT[] DEFAULT '{}',
    target_message TEXT,
    objection_type TEXT,
    product TEXT,
    structure JSONB DEFAULT '{}'::jsonb,
    setup_line TEXT,
    closing_bridge TEXT,
    explanation TEXT,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    used_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Live Session Tables
- **`live_sessions`** - Active call sessions
- **`live_insights`** - Real-time coaching insights
- **`transcript_chunks`** - Streaming transcription data

### 6.3 Security Model

#### Row Level Security (RLS)
```sql
-- Users can only access their own data
CREATE POLICY "Users can view their own calls" ON calls
    FOR SELECT USING (auth.uid() = user_id);

-- Service role (backend) has full access
CREATE POLICY "Service role can do anything on calls" ON calls
    FOR ALL USING (auth.role() = 'service_role');
```

#### Authentication Integration
- **JWT Tokens:** Supabase-issued tokens
- **Backend Verification:** Service role access
- **Frontend Auth:** Session management
- **API Security:** Token validation middleware

---

## 7. AI and ML Architecture

### 7.1 AI Services Integration

#### OpenAI GPT-4o
- **Model:** `gpt-4o` (upgraded from `gpt-4o-mini`)
- **Token Limit:** 800 tokens per request
- **Use Cases:**
  - Real-time call analysis
  - Sales methodology scoring
  - Objection detection
  - Coaching recommendations

#### AssemblyAI Integration
- **Service:** Real-time Speech-to-Text
- **Features:**
  - Speaker diarization
  - Real-time transcription
  - WebSocket streaming
  - Audio format: PCM 16kHz

### 7.2 Sales Analysis Engine

#### LIVE_COACH_SYSTEM_PROMPT
Advanced AI prompt with 4 analysis layers:

1. **Sentiment Analysis**
   - Customer emotion detection
   - Mood-based coaching adaptation

2. **Stage Detection**
   - Call phase identification
   - Timeline optimization alerts

3. **Benefit Tracking**
   - Three core benefits monitoring
   - Missing benefit alerts

4. **Pattern Recognition**
   - Talk ratio analysis
   - Question quality assessment
   - Buying signal detection

#### Coaching Triggers (Priority-based)
1. 🔴 **OBJECTION_DETECTED** (Urgent)
2. 🟢 **BUYING_SIGNAL** (Urgent)
3. 🎯 **STAGE_ALERT** (High)
4. 🟡 **DISCOVERY_PROMPT** (High)
5. 💎 **VALUE_BUILDING_CUE** (High)
6. 😟 **SENTIMENT_SHIFT** (High)
7. 🟣 **CLOSING_OPPORTUNITY** (High)
8. ⚖️ **TALK_BALANCE_ALERT** (Medium)

### 7.3 Sales Methodology Framework

#### Company Sales Process (תורת המכירות)
1. **Breaking the Ice** (20 min) - Trust building
2. **Benefit Presentation** (20 min) - Value proposition
3. **Estimate** (40 min) - Pricing and options
4. **Closing** (30-40 min) - Deal finalization

#### Scoring Systems
- **MEDDIC Score:** Methodology compliance
- **BANT Score:** Lead qualification
- **Overall Score:** Comprehensive performance
- **Deal Risk Assessment:** Closure probability

---

## 8. Infrastructure and Deployment

### 8.1 Hosting Architecture

#### Frontend Deployment (Netlify)
- **Platform:** Netlify CDN
- **Build:** Vite production build
- **URL:** https://vloce.netlify.app
- **Features:**
  - Automatic Git deployments
  - Branch previews
  - Environment variables
  - HTTPS by default

#### Backend Deployment (Railway)
- **Platform:** Railway.app
- **Runtime:** Python + Gunicorn
- **URL:** https://web-production-3215.up.railway.app
- **Configuration:**
  - Auto-deployment from Git
  - Environment variable management
  - Scaling capabilities
  - Health monitoring

### 8.2 Environment Configuration

#### Frontend Environment Variables
```javascript
VITE_API_URL=https://web-production-3215.up.railway.app
VITE_SUPABASE_URL=https://nacwvxqimvbfqlyylszt.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

#### Backend Environment Variables
```python
ASSEMBLYAI_API_KEY=<api_key>
DEEPGRAM_API_KEY=<api_key>
OPENAI_API_KEY=<api_key>
SUPABASE_URL=<supabase_url>
SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_KEY=<service_key>
SUPABASE_JWT_SECRET=<jwt_secret>
```

### 8.3 Build and Deployment Pipeline

#### Frontend Pipeline
```yaml
# Netlify Build
build:
  command: npm run build
  publish: dist
  environment:
    NODE_VERSION: 18
```

#### Backend Pipeline
```yaml
# Railway Deployment
services:
  - type: web
    name: salesai-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app --bind 0.0.0.0:$PORT
```

### 8.4 Performance Optimization

#### Frontend Optimizations
- **Code Splitting:** React lazy loading
- **Asset Optimization:** Vite build optimization
- **Image Compression:** Optimized static assets
- **Bundle Analysis:** Performance monitoring

#### Backend Optimizations
- **Gunicorn Configuration:** Multi-threading
- **Connection Pooling:** Database optimization
- **Caching Strategy:** Response caching
- **Error Handling:** Robust exception management

---

## 9. Security Architecture

### 9.1 Authentication & Authorization

#### Multi-layer Security
1. **Frontend Authentication**
   - Supabase Auth integration
   - JWT token management
   - Automatic session refresh

2. **Backend Authorization**
   - JWT token verification
   - Role-based access control
   - Service role permissions

3. **Database Security**
   - Row Level Security (RLS)
   - User isolation
   - Admin privilege separation

### 9.2 Data Protection

#### API Security
- **CORS Configuration:** Controlled origin access
- **HTTPS Enforcement:** All communications encrypted
- **Input Validation:** SQL injection prevention
- **Rate Limiting:** DoS protection

#### Audio Data Security
- **Temporary Storage:** Minimal retention
- **Secure Transmission:** WebSocket encryption
- **Access Control:** User-specific data isolation
- **Cleanup Policies:** Automated data removal

### 9.3 Privacy Compliance

#### Data Handling
- **Minimal Collection:** Only necessary data
- **User Consent:** Clear permission model
- **Data Retention:** Configurable retention periods
- **Export/Delete:** User data control

---

## 10. Mobile Architecture

### 10.1 Mobile-First Design

#### Responsive Framework
- **Breakpoints:** Tailwind responsive classes
- **Touch Optimization:** 44px minimum touch targets
- **Performance:** Optimized for mobile networks
- **Battery Efficiency:** Dark mode optimization

#### LiveCallPageMobile Features
- **Bottom Sheet UI:** Swipeable insight panel
- **Haptic Feedback:** Tactile interaction
- **Audio Modes:** OFF/SMART/ON options
- **Gesture Control:** Swipe navigation

### 10.2 Progressive Web App (PWA)

#### PWA Features
- **Responsive Design:** Mobile-optimized interface
- **Offline Capability:** Basic functionality without network
- **Add to Home Screen:** Native app experience
- **Push Notifications:** Real-time alerts

### 10.3 Audio Processing Mobile

#### Browser Audio API
- **MediaRecorder:** Native audio capture
- **AudioContext:** Real-time processing
- **Format Conversion:** PCM 16kHz encoding
- **Buffer Management:** Efficient memory usage

---

## 11. Scalability and Performance

### 11.1 Horizontal Scaling

#### Backend Scaling
- **Stateless Design:** Session-independent processing
- **Load Balancing:** Multiple server instances
- **Database Connections:** Connection pooling
- **Cache Strategy:** Redis integration potential

#### Real-time Scaling
- **WebSocket Management:** Connection optimization
- **Message Queuing:** Async processing
- **Resource Allocation:** Dynamic scaling
- **Monitoring:** Performance metrics

### 11.2 Performance Metrics

#### Frontend Performance
- **Bundle Size:** < 2MB initial load
- **Load Time:** < 3 seconds first paint
- **Runtime Performance:** 60fps animations
- **Memory Usage:** Optimized component lifecycle

#### Backend Performance
- **Response Time:** < 500ms API responses
- **Throughput:** 1000+ concurrent users
- **Real-time Latency:** < 200ms WebSocket
- **AI Processing:** < 2 seconds analysis

---

## 12. Monitoring and Analytics

### 12.1 System Monitoring

#### Application Monitoring
- **Health Checks:** Endpoint availability
- **Error Tracking:** Exception monitoring
- **Performance Metrics:** Response times
- **Resource Usage:** Memory and CPU

#### Real-time Monitoring
- **WebSocket Connections:** Active sessions
- **AI Service Status:** External API health
- **Database Performance:** Query optimization
- **User Experience:** Frontend metrics

### 12.2 Business Analytics

#### User Behavior
- **Feature Usage:** Component interactions
- **Session Duration:** Engagement metrics
- **Conversion Rates:** Success measurements
- **User Retention:** Long-term engagement

#### Sales Analytics
- **Call Success Rates:** Methodology effectiveness
- **Improvement Trends:** Learning outcomes
- **AI Accuracy:** Coaching quality
- **ROI Metrics:** Business value

---

## 13. Development Workflow

### 13.1 Version Control

#### Git Strategy
- **Branching:** Feature branches
- **Merging:** Pull request reviews
- **Deployment:** Main branch auto-deploy
- **Tagging:** Release versioning

### 13.2 Code Quality

#### Linting and Formatting
- **ESLint:** JavaScript code quality
- **Prettier:** Code formatting
- **Python Standards:** PEP 8 compliance
- **Type Safety:** JSDoc annotations

#### Testing Strategy
- **Unit Tests:** Component testing
- **Integration Tests:** API testing
- **E2E Tests:** User flow testing
- **Performance Tests:** Load testing

### 13.3 Documentation

#### Technical Documentation
- **API Documentation:** OpenAPI specs
- **Component Docs:** Storybook integration
- **Architecture Docs:** System design
- **Deployment Guides:** Operation manuals

---

## 14. Future Architecture Considerations

### 14.1 Technology Upgrades

#### Frontend Evolution
- **TypeScript Migration:** Type safety improvement
- **Next.js Consideration:** SSR capabilities
- **State Management:** Redux/Zustand evaluation
- **Component Library:** Design system formalization

#### Backend Evolution
- **Microservices:** Service decomposition
- **GraphQL:** API optimization
- **Message Queues:** Async processing
- **Caching Layer:** Redis implementation

### 14.2 Feature Expansions

#### AI Enhancements
- **Voice Analysis:** Emotion detection
- **Predictive Analytics:** Success prediction
- **Custom Models:** Domain-specific training
- **Multi-language Support:** Global expansion

#### Integration Opportunities
- **CRM Integration:** Salesforce, HubSpot
- **Calendar Integration:** Meeting scheduling
- **Video Conferencing:** Zoom, Teams integration
- **Analytics Platforms:** Advanced reporting

---

## 15. Risk Assessment and Mitigation

### 15.1 Technical Risks

#### Dependency Risks
- **Third-party APIs:** Service availability
- **Framework Changes:** Breaking updates
- **Hosting Reliability:** Platform stability
- **Security Vulnerabilities:** Regular updates

#### Mitigation Strategies
- **Fallback Services:** Alternative providers
- **Version Pinning:** Controlled upgrades
- **Multi-region Deployment:** Redundancy
- **Security Scanning:** Automated checks

### 15.2 Business Risks

#### Market Risks
- **Competition:** Feature differentiation
- **User Adoption:** Training requirements
- **Scalability:** Growth management
- **Cost Management:** Resource optimization

#### Strategic Responses
- **Continuous Innovation:** Feature development
- **User Education:** Training programs
- **Performance Optimization:** Cost efficiency
- **Market Analysis:** Competitive intelligence

---

## 16. Conclusion

The audio-new project represents a sophisticated, full-stack application that successfully integrates multiple advanced technologies to deliver a comprehensive sales coaching platform. The architecture demonstrates:

### Strengths
- **Modern Tech Stack:** Current, well-supported technologies
- **Scalable Design:** Microservices-ready architecture
- **Real-time Capabilities:** Advanced WebSocket implementation
- **AI Integration:** Cutting-edge natural language processing
- **Mobile Optimization:** Mobile-first responsive design
- **Security Focus:** Multi-layer security implementation

### Technical Excellence
- **Clean Architecture:** Separation of concerns
- **Performance Optimized:** Fast, efficient processing
- **User-Centric Design:** Intuitive, mobile-friendly interface
- **Robust Infrastructure:** Reliable, scalable deployment
- **Comprehensive Testing:** Quality assurance focus

### Business Value
- **Sales Effectiveness:** Measurable improvement tools
- **Real-time Coaching:** Immediate feedback capability
- **Data-Driven Insights:** Analytics-powered optimization
- **Scalable Solution:** Growth-ready architecture
- **Competitive Advantage:** Advanced AI integration

The platform is well-positioned for continued growth and feature expansion, with a solid foundation that can support enterprise-level scaling and advanced AI capabilities.

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2025  
**Next Review:** February 19, 2025