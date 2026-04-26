"""
storage.py
----------
Azure Blob Storage helper for uploading game media (thumbnails and preview videos).
Blob URLs are stored in the database; binary data lives in Azure.
"""
from __future__ import annotations
import io
import mimetypes
import uuid
from typing import Literal

MediaKind = Literal["thumbnail", "video"]

_container_client = None


def _get_container_client():
    """Lazy-init the Azure container client so the app starts without credentials."""
    global _container_client
    if _container_client is None:
        try:
            from azure.storage.blob import BlobServiceClient
            from database import settings

            if not settings.AZURE_STORAGE_CONNECTION_STRING:
                raise RuntimeError("AZURE_STORAGE_CONNECTION_STRING is not configured.")

            service = BlobServiceClient.from_connection_string(
                settings.AZURE_STORAGE_CONNECTION_STRING
            )
            _container_client = service.get_container_client(
                settings.AZURE_STORAGE_CONTAINER_GAMES
            )
            # Create container if it doesn't exist yet
            if not _container_client.exists():
                _container_client.create_container(public_access="blob")
        except Exception as exc:
            raise RuntimeError(f"Cannot connect to Azure Blob Storage: {exc}") from exc
    return _container_client


def upload_game_media(
    game_id: int,
    kind: MediaKind,
    file_bytes: bytes,
    original_filename: str,
) -> str:
    """
    Upload a game image or video to Azure Blob Storage.

    Returns the public blob URL to be persisted in the database.

    Blob naming convention:
        games/{game_id}/{kind}/{uuid}.{ext}
    """
    container = _get_container_client()

    content_type, _ = mimetypes.guess_type(original_filename)
    ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
    blob_name = f"games/{game_id}/{kind}/{uuid.uuid4().hex}.{ext}"

    blob_client = container.get_blob_client(blob_name)
    blob_client.upload_blob(
        io.BytesIO(file_bytes),
        overwrite=True,
        content_settings={"content_type": content_type or "application/octet-stream"},
    )

    return blob_client.url
