"""Tests for the /admin endpoints."""
from datetime import date, timedelta


class TestAdminCreateGame:
    def test_create_game(self, client):
        resp = client.post("/admin/games", json={
            "name": "New VR Game",
            "description": "A brand new VR experience.",
            "category": "Action",
            "thumbnail_url": "https://example.com/new.jpg",
            "status": "ACTIVE",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "New VR Game"
        assert data["category"] == "Action"
        assert data["visit_count"] == 0
        assert "id" in data
        assert "created_at" in data

    def test_create_game_with_optional_fields(self, client):
        resp = client.post("/admin/games", json={
            "name": "Multiplayer Game",
            "description": "Play with friends.",
            "category": "Sports",
            "thumbnail_url": "https://example.com/multi.jpg",
            "youtube_url": "https://youtube.com/watch?v=abc",
            "viewable_age": 12,
            "is_multiplayer": True,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["is_multiplayer"] is True
        assert data["viewable_age"] == 12
        assert data["youtube_url"] == "https://youtube.com/watch?v=abc"

    def test_create_game_missing_required_fields(self, client):
        resp = client.post("/admin/games", json={
            "name": "Incomplete Game",
        })
        assert resp.status_code == 422

    def test_create_game_invalid_category(self, client):
        resp = client.post("/admin/games", json={
            "name": "Bad Category Game",
            "description": "Testing bad category.",
            "category": "NonExistentCategory",
            "thumbnail_url": "https://example.com/bad.jpg",
        })
        assert resp.status_code == 422


class TestAdminUpdateGame:
    def test_update_game(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.patch(f"/admin/games/{game_id}", json={
            "name": "Beat Saber Updated",
            "description": "Updated description.",
            "category": "Action",
            "thumbnail_url": "https://example.com/updated.jpg",
        })
        assert resp.status_code == 200
        assert resp.json()["name"] == "Beat Saber Updated"

    def test_update_nonexistent_game(self, client):
        resp = client.patch("/admin/games/9999", json={
            "name": "Ghost",
            "description": "Does not exist.",
            "category": "Action",
            "thumbnail_url": "https://example.com/ghost.jpg",
        })
        assert resp.status_code == 404


class TestAdminCreateHeadset:
    def test_create_headset(self, client):
        resp = client.post("/admin/headsets", params={
            "code": "DZ10",
            "model": "Meta Quest Pro",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["code"] == "DZ10"
        assert data["model"] == "Meta Quest Pro"
        assert data["is_active"] is True

    def test_create_headset_default_model(self, client):
        resp = client.post("/admin/headsets", params={"code": "DZ11"})
        assert resp.status_code == 201
        assert resp.json()["model"] == "Meta Quest 3"

    def test_create_duplicate_headset(self, client, seed_data):
        resp = client.post("/admin/headsets", params={"code": "DZ1"})
        assert resp.status_code == 409
        assert "already exists" in resp.json()["detail"]


class TestAdminCreateInstallation:
    def test_create_installation(self, client, seed_data):
        game_id = seed_data["games"][2].id  # Gorilla Tag
        headset_id = seed_data["headsets"][0].id  # DZ1
        today = date.today().isoformat()
        expiry = (date.today() + timedelta(days=90)).isoformat()

        resp = client.post("/admin/installations", json={
            "game_id": game_id,
            "headset_id": headset_id,
            "install_date": today,
            "expiry_date": expiry,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["game_id"] == game_id
        assert data["headset_id"] == headset_id
        assert data["installation_status"] == "ACTIVE"

    def test_create_installation_nonexistent_game(self, client, seed_data):
        headset_id = seed_data["headsets"][0].id
        today = date.today().isoformat()
        expiry = (date.today() + timedelta(days=90)).isoformat()
        resp = client.post("/admin/installations", json={
            "game_id": 9999,
            "headset_id": headset_id,
            "install_date": today,
            "expiry_date": expiry,
        })
        assert resp.status_code == 404

    def test_create_installation_nonexistent_headset(self, client, seed_data):
        game_id = seed_data["games"][0].id
        today = date.today().isoformat()
        expiry = (date.today() + timedelta(days=90)).isoformat()
        resp = client.post("/admin/installations", json={
            "game_id": game_id,
            "headset_id": 9999,
            "install_date": today,
            "expiry_date": expiry,
        })
        assert resp.status_code == 404


class TestAdminMediaUpload:
    def test_upload_thumbnail_invalid_type(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.post(
            f"/admin/games/{game_id}/upload-thumbnail",
            files={"file": ("test.txt", b"not an image", "text/plain")},
        )
        assert resp.status_code == 400
        assert "Unsupported image type" in resp.json()["detail"]

    def test_upload_video_invalid_type(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.post(
            f"/admin/games/{game_id}/upload-video",
            files={"file": ("test.txt", b"not a video", "text/plain")},
        )
        assert resp.status_code == 400
        assert "Unsupported video type" in resp.json()["detail"]

    def test_upload_thumbnail_nonexistent_game(self, client):
        resp = client.post(
            "/admin/games/9999/upload-thumbnail",
            files={"file": ("img.jpg", b"\xff\xd8\xff", "image/jpeg")},
        )
        assert resp.status_code == 404

    def test_upload_video_nonexistent_game(self, client):
        resp = client.post(
            "/admin/games/9999/upload-video",
            files={"file": ("vid.mp4", b"\x00\x00", "video/mp4")},
        )
        assert resp.status_code == 404
