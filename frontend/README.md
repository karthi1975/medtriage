# Medical Triage System - Frontend

React-based frontend for the Medical Triage System providing an intuitive chat interface for symptom assessment and triage recommendations.

## Features

- **Interactive Chat Interface**: Conversational UI for symptom collection
- **Real-time Triage Assessment**: Immediate priority determination and care recommendations
- **Visual Results Display**: Clear presentation of triage results with color-coded priorities
- **Patient Context Support**: Optional patient ID integration for personalized assessments
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 16+ and npm
- Backend API running on http://localhost:8002 (or configure custom URL)

## Installation

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure API URL** (optional):

Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:8002
```

If not specified, defaults to `http://localhost:8002`.

## Running the Application

### Development Mode

```bash
npm start
```

The application will open at http://localhost:3000

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Serving Production Build

```bash
npm install -g serve
serve -s build -p 3000
```

## Usage

1. **Start the Backend API**: Ensure the FastAPI backend is running on port 8002

2. **Launch Frontend**: Run `npm start`

3. **Assess Symptoms**:
   - Enter symptoms in the chat interface
   - Optionally provide a patient ID for context
   - Submit your message
   - View triage assessment and recommendations

## Project Structure

```
frontend/
├── public/
│   └── index.html           # HTML template
├── src/
│   ├── components/
│   │   ├── ChatInterface.js     # Chat UI component
│   │   └── TriageResults.js     # Results display component
│   ├── services/
│   │   └── api.js               # API client
│   ├── styles/
│   │   ├── App.css
│   │   ├── ChatInterface.css
│   │   ├── TriageResults.css
│   │   └── index.css
│   ├── App.js               # Main application component
│   └── index.js             # Application entry point
├── package.json
└── README.md
```

## Components

### ChatInterface

- Conversational UI for symptom collection
- Message history display
- Patient ID input
- Real-time loading states

### TriageResults

- Priority badge with color coding:
  - 🚨 **Emergency** (Red): Immediate emergency care needed
  - ⚠️ **Urgent** (Orange): Medical attention within hours
  - ⏰ **Semi-Urgent** (Yellow): See doctor within 24-48 hours
  - ✓ **Non-Urgent** (Green): Regular appointment or self-care
- Extracted symptoms with severity indicators
- Care recommendations
- Warning signs to watch for
- Disclaimer notice

## API Integration

The frontend communicates with the backend through the following endpoints:

- `GET /health` - Health check
- `GET /api/v1/patients/{id}` - Get patient history
- `POST /api/v1/extract-symptoms` - Extract symptoms from text
- `POST /api/v1/chat` - Chat with AI assistant
- `POST /api/v1/triage` - Perform triage assessment

See `src/services/api.js` for implementation details.

## Configuration

### Environment Variables

- `REACT_APP_API_URL`: Backend API base URL (default: http://localhost:8002)

### Proxy Configuration

The `package.json` includes a proxy configuration for development:
```json
"proxy": "http://localhost:8002"
```

This allows API calls without CORS issues during development.

## Styling

The application uses custom CSS with:
- Responsive grid layout
- Color-coded priority indicators
- Smooth animations and transitions
- Mobile-friendly design

## Troubleshooting

### Cannot Connect to API

- Verify backend is running: `curl http://localhost:8002/health`
- Check API URL in environment variables
- Ensure CORS is configured in backend

### Build Errors

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear React cache
rm -rf node_modules/.cache
npm start
```

### Port Already in Use

```bash
# Use different port
PORT=3001 npm start
```

## Development

### Adding New Features

1. **New Component**: Add to `src/components/`
2. **New API Call**: Add to `src/services/api.js`
3. **New Styles**: Add CSS file in `src/styles/`

### Code Style

- Use functional components with hooks
- Follow React best practices
- Keep components modular and reusable
- Document complex logic

## Deployment

### Docker Deployment

A Dockerfile is provided in the project root for containerized deployment.

### Static Hosting

The production build can be hosted on:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting service

## License

[Add your license information]

## Support

For issues or questions, refer to the main project documentation.
