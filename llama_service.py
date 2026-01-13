"""
Llama 4 API Service for Medical Triage
Integrates Google Cloud's Llama 4 Maverick model
"""
import os
import json
import logging
from typing import List, Dict, Optional
import subprocess
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

logger = logging.getLogger(__name__)


class LlamaService:
    """Service for interacting with Llama 4 API on Google Cloud"""

    def __init__(self):
        self.project_id = os.getenv("PROJECT_ID", "project-c78515e0-ee8f-4282-a3c")
        self.endpoint = os.getenv("ENDPOINT", "us-east5-aiplatform.googleapis.com")
        self.region = os.getenv("REGION", "us-east5")
        self.model = "meta/llama-4-maverick-17b-128e-instruct-maas"
        self.base_url = f"https://{self.endpoint}/v1/projects/{self.project_id}/locations/{self.region}/endpoints/openapi/chat/completions"

        # Service account credentials path
        self.service_account_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        self.credentials = None

        # Try to load service account credentials if available
        if self.service_account_path and os.path.exists(self.service_account_path):
            try:
                self.credentials = service_account.Credentials.from_service_account_file(
                    self.service_account_path,
                    scopes=['https://www.googleapis.com/auth/cloud-platform']
                )
                logger.info(f"LlamaService initialized with service account from: {self.service_account_path}")
            except Exception as e:
                logger.warning(f"Failed to load service account credentials: {e}")
                logger.info("Falling back to gcloud CLI authentication")
        else:
            logger.info("No service account configured, using gcloud CLI authentication")

        logger.info(f"LlamaService initialized with project: {self.project_id}, region: {self.region}")

    def get_access_token(self) -> Optional[str]:
        """
        Get Google Cloud access token.
        Priority:
        1. Service account from key file (if GOOGLE_APPLICATION_CREDENTIALS set)
        2. gcloud CLI (for local development - works best with user permissions)
        3. Application Default Credentials (for GCP environments - Cloud Run, Compute Engine, etc.)
        """
        # Method 1: Use service account credentials from file (if configured)
        if self.credentials:
            try:
                # Refresh token if expired
                if not self.credentials.valid:
                    self.credentials.refresh(Request())
                token = self.credentials.token
                logger.debug("Successfully obtained access token from service account file")
                return token
            except Exception as e:
                logger.error(f"Failed to get access token from service account file: {e}")
                # Fall through to next method

        # Method 2: Use gcloud CLI (best for local development with full user permissions)
        try:
            result = subprocess.run(
                ["gcloud", "auth", "print-access-token"],
                capture_output=True,
                text=True,
                check=True
            )
            token = result.stdout.strip()
            logger.info("Using gcloud CLI authentication")
            logger.debug("Successfully obtained access token from gcloud CLI")
            return token
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            logger.warning(f"gcloud CLI not available or not authenticated: {e}")
            # Fall through to ADC method

        # Method 3: Use Application Default Credentials (for GCP deployment)
        # This works automatically on Cloud Run, Compute Engine, GKE, etc.
        try:
            import google.auth
            from google.auth import compute_engine

            credentials, project = google.auth.default(
                scopes=['https://www.googleapis.com/auth/cloud-platform'],
                quota_project_id=self.project_id
            )

            # Check if we're using compute engine credentials (attached service account)
            if isinstance(credentials, compute_engine.Credentials):
                logger.info("Using Application Default Credentials from GCP metadata service")
            else:
                logger.info("Using Application Default Credentials from local environment")

            # Refresh to get token
            if not credentials.valid:
                credentials.refresh(Request())

            token = credentials.token
            logger.debug("Successfully obtained access token from Application Default Credentials")
            return token

        except Exception as e:
            logger.error(f"Failed to get Application Default Credentials: {e}")
            logger.error("Cannot proceed without access token")
            return None
        except FileNotFoundError:
            logger.error("gcloud CLI not found. Please install Google Cloud SDK or configure service account")
            return None

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        stream: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> Optional[Dict]:
        """
        Send a chat completion request to Llama 4

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            stream: Whether to stream the response
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate

        Returns:
            Response dictionary or None if failed
        """
        token = self.get_access_token()
        if not token:
            logger.error("Cannot proceed without access token")
            return None

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": stream,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            logger.info(f"Sending request to Llama 4 API with {len(messages)} messages")
            response = requests.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()

            if stream:
                return self._handle_streaming_response(response)
            else:
                result = response.json()
                logger.info("Successfully received response from Llama 4")
                return result

        except requests.exceptions.RequestException as e:
            logger.error(f"Request to Llama 4 API failed: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"Response: {e.response.text}")
            return None

    def _handle_streaming_response(self, response):
        """Handle streaming response from the API"""
        full_response = ""
        for line in response.iter_lines():
            if line:
                try:
                    data = json.loads(line.decode('utf-8'))
                    if 'choices' in data and len(data['choices']) > 0:
                        content = data['choices'][0].get('delta', {}).get('content', '')
                        full_response += content
                except json.JSONDecodeError:
                    continue

        return {"content": full_response}

    def medical_triage(self, patient_symptoms: str, patient_history: Optional[Dict] = None) -> Optional[str]:
        """
        Perform medical triage using Llama 4

        Args:
            patient_symptoms: Description of patient symptoms
            patient_history: Optional patient medical history

        Returns:
            Triage recommendation or None if failed
        """
        system_prompt = """You are a medical AI assistant helping with patient triage.
        Based on the patient's symptoms and history, provide:
        1. Severity assessment (Emergency, Urgent, Semi-Urgent, Non-Urgent)
        2. Recommended medical specialty
        3. Key concerns to address
        4. Suggested next steps

        Be concise and professional."""

        user_message = f"Patient Symptoms: {patient_symptoms}"

        if patient_history:
            history_str = "\n".join([f"{k}: {v}" for k, v in patient_history.items()])
            user_message += f"\n\nPatient History:\n{history_str}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

        response = self.chat_completion(messages, temperature=0.3)

        if response and 'choices' in response:
            return response['choices'][0]['message']['content']
        elif response and 'content' in response:
            return response['content']

        return None

    def generate_medical_summary(self, clinical_notes: str) -> Optional[str]:
        """
        Generate a medical summary from clinical notes

        Args:
            clinical_notes: Raw clinical notes

        Returns:
            Formatted medical summary or None if failed
        """
        messages = [
            {
                "role": "system",
                "content": "You are a medical documentation assistant. Summarize clinical notes into a clear, structured format."
            },
            {
                "role": "user",
                "content": f"Please summarize these clinical notes:\n\n{clinical_notes}"
            }
        ]

        response = self.chat_completion(messages, temperature=0.2)

        if response and 'choices' in response:
            return response['choices'][0]['message']['content']
        elif response and 'content' in response:
            return response['content']

        return None


# Initialize singleton instance
_llama_service = None


def get_llama_service() -> LlamaService:
    """Get or create singleton LlamaService instance"""
    global _llama_service
    if _llama_service is None:
        _llama_service = LlamaService()
    return _llama_service
