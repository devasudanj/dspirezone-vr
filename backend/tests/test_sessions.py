"""Tests for the /sessions endpoints."""


class TestCreateSession:
    def test_create_session_success(self, client, seed_data):
        game_id = seed_data["games"][0].id  # Beat Saber (has active installs)
        resp = client.post("/sessions/", json={
            "game_id": game_id,
            "duration_minutes": 30,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["game_id"] == game_id
        assert data["duration_minutes"] == 30
        assert data["game_name"] == "Beat Saber"
        assert data["session_code"].startswith("DZ-")
        assert isinstance(data["headset_codes"], list)
        assert len(data["headset_codes"]) > 0

    def test_create_session_all_valid_durations(self, client, seed_data):
        game_id = seed_data["games"][0].id
        for duration in [10, 30, 45, 60]:
            resp = client.post("/sessions/", json={
                "game_id": game_id,
                "duration_minutes": duration,
            })
            assert resp.status_code == 201
            assert resp.json()["duration_minutes"] == duration

    def test_create_session_invalid_duration(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.post("/sessions/", json={
            "game_id": game_id,
            "duration_minutes": 15,
        })
        assert resp.status_code == 422

    def test_create_session_nonexistent_game(self, client):
        resp = client.post("/sessions/", json={
            "game_id": 9999,
            "duration_minutes": 30,
        })
        assert resp.status_code == 404

    def test_create_session_disabled_game(self, client, seed_data):
        game_id = seed_data["games"][3].id  # Retired Game (DISABLED)
        resp = client.post("/sessions/", json={
            "game_id": game_id,
            "duration_minutes": 30,
        })
        assert resp.status_code == 400
        assert "not active" in resp.json()["detail"]

    def test_create_session_no_installations(self, client, seed_data):
        game_id = seed_data["games"][2].id  # Gorilla Tag (no installations in seed)
        resp = client.post("/sessions/", json={
            "game_id": game_id,
            "duration_minutes": 30,
        })
        assert resp.status_code == 400
        assert "No active headset installations" in resp.json()["detail"]

    def test_create_session_unique_codes(self, client, seed_data):
        game_id = seed_data["games"][0].id
        codes = set()
        for _ in range(5):
            resp = client.post("/sessions/", json={
                "game_id": game_id,
                "duration_minutes": 30,
            })
            codes.add(resp.json()["session_code"])
        assert len(codes) == 5  # all unique

    def test_create_session_missing_fields(self, client):
        resp = client.post("/sessions/", json={})
        assert resp.status_code == 422

    def test_create_session_negative_duration(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.post("/sessions/", json={
            "game_id": game_id,
            "duration_minutes": -10,
        })
        assert resp.status_code == 422


class TestGetSession:
    def test_get_session(self, client, seed_data):
        game_id = seed_data["games"][0].id
        create_resp = client.post("/sessions/", json={
            "game_id": game_id,
            "duration_minutes": 30,
        })
        session_id = create_resp.json()["id"]

        resp = client.get(f"/sessions/{session_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == session_id
        assert data["game_name"] == "Beat Saber"

    def test_get_nonexistent_session(self, client):
        resp = client.get("/sessions/9999")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Session not found"

    def test_session_response_shape(self, client, seed_data):
        game_id = seed_data["games"][0].id
        create_resp = client.post("/sessions/", json={
            "game_id": game_id,
            "duration_minutes": 60,
        })
        session_id = create_resp.json()["id"]

        resp = client.get(f"/sessions/{session_id}")
        data = resp.json()
        assert "id" in data
        assert "session_code" in data
        assert "game_id" in data
        assert "duration_minutes" in data
        assert "created_at" in data
        assert "game_name" in data
        assert "headset_codes" in data
