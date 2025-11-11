"""
RAG (Retrieval Augmented Generation) Service
Retrieves relevant medical knowledge to enhance triage decisions
"""
import logging
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import os

from medical_knowledge_base import get_all_knowledge_chunks, MEDICAL_KNOWLEDGE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGService:
    """Service for retrieving relevant medical knowledge using vector similarity"""

    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Initialize RAG service with ChromaDB

        Args:
            persist_directory: Directory to persist the vector database
        """
        self.persist_directory = persist_directory

        # Initialize embedding model
        logger.info("Loading embedding model...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

        # Initialize ChromaDB
        logger.info(f"Initializing ChromaDB at {persist_directory}")
        self.client = chromadb.PersistentClient(path=persist_directory)

        # Get or create collection
        try:
            self.collection = self.client.get_collection(name="medical_knowledge")
            logger.info(f"Loaded existing collection with {self.collection.count()} documents")
        except:
            logger.info("Creating new medical knowledge collection")
            self.collection = self.client.create_collection(
                name="medical_knowledge",
                metadata={"description": "Medical triage guidelines and clinical knowledge"}
            )
            self._populate_knowledge_base()

    def _populate_knowledge_base(self):
        """Populate the vector database with medical knowledge"""
        logger.info("Populating knowledge base with medical documents...")

        documents = []
        metadatas = []
        ids = []

        for idx, item in enumerate(MEDICAL_KNOWLEDGE):
            documents.append(item["content"])
            metadatas.append({"category": item["category"]})
            ids.append(f"doc_{idx}")

        # Add documents to collection
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

        logger.info(f"Added {len(documents)} medical documents to vector database")

    def retrieve_relevant_knowledge(
        self,
        query: str,
        n_results: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant medical knowledge based on query

        Args:
            query: User's symptom description or question
            n_results: Number of relevant documents to retrieve

        Returns:
            List of relevant knowledge chunks with metadata
        """
        try:
            logger.info(f"Retrieving relevant knowledge for: {query[:50]}...")

            # Query the collection
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )

            # Format results
            retrieved_docs = []
            if results and results['documents'] and len(results['documents']) > 0:
                for i, doc in enumerate(results['documents'][0]):
                    retrieved_docs.append({
                        'content': doc,
                        'category': results['metadatas'][0][i]['category'],
                        'distance': results['distances'][0][i] if 'distances' in results else None
                    })

                logger.info(f"Retrieved {len(retrieved_docs)} relevant documents")
                for doc in retrieved_docs:
                    distance_str = f"{doc['distance']:.3f}" if doc['distance'] is not None else 'N/A'
                    logger.info(f"  - Category: {doc['category']}, Distance: {distance_str}")

            return retrieved_docs

        except Exception as e:
            logger.error(f"Error retrieving knowledge: {str(e)}")
            return []

    def augment_prompt_with_knowledge(
        self,
        base_prompt: str,
        query: str,
        n_results: int = 2
    ) -> str:
        """
        Augment the base prompt with retrieved medical knowledge

        Args:
            base_prompt: Original triage prompt
            query: User's symptoms/query
            n_results: Number of knowledge chunks to retrieve

        Returns:
            Enhanced prompt with retrieved knowledge
        """
        # Retrieve relevant knowledge
        retrieved_docs = self.retrieve_relevant_knowledge(query, n_results)

        if not retrieved_docs:
            logger.warning("No relevant knowledge retrieved, using base prompt")
            return base_prompt

        # Build knowledge context
        knowledge_context = "\n\n=== RETRIEVED MEDICAL KNOWLEDGE ===\n"
        knowledge_context += "Use the following clinical guidelines to inform your assessment:\n\n"

        for i, doc in enumerate(retrieved_docs, 1):
            knowledge_context += f"[Guideline {i} - {doc['category']}]\n"
            knowledge_context += doc['content']
            knowledge_context += "\n\n"

        knowledge_context += "=== END RETRIEVED KNOWLEDGE ===\n\n"

        # Insert knowledge before the main prompt
        augmented_prompt = knowledge_context + base_prompt

        logger.info(f"Augmented prompt with {len(retrieved_docs)} knowledge chunks")

        return augmented_prompt

    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about the knowledge base"""
        return {
            "total_documents": self.collection.count(),
            "persist_directory": self.persist_directory,
            "embedding_model": "all-MiniLM-L6-v2"
        }

    def search_by_category(self, category: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Search for documents by category

        Args:
            category: Category to search for
            n_results: Maximum results to return

        Returns:
            List of documents in the category
        """
        try:
            results = self.collection.get(
                where={"category": category},
                limit=n_results
            )

            formatted_results = []
            if results and results['documents']:
                for i, doc in enumerate(results['documents']):
                    formatted_results.append({
                        'content': doc,
                        'category': results['metadatas'][i]['category'] if 'metadatas' in results else category
                    })

            return formatted_results

        except Exception as e:
            logger.error(f"Error searching by category: {str(e)}")
            return []


# Singleton instance
_rag_service_instance = None


def get_rag_service(persist_directory: str = "./chroma_db") -> RAGService:
    """Get or create RAG service singleton"""
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGService(persist_directory)
    return _rag_service_instance
