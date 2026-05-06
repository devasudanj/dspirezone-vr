"""Tests for the /games endpoints."""


class TestListGames:
    def test_list_games_empty(self, client):
        resp = client.get("/games/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_games_returns_active_by_default(self, client, seed_data):
        resp = client.get("/games/")
        assert resp.status_code == 200
        data = resp.json()
        # seed_data has 3 ACTIVE + 1 DISABLED; default filter is ACTIVE
        assert len(data) == 3
        names = {g["name"] for g in data}
        assert "Retired Game" not in names

    def test_list_games_filter_by_category(self, client, seed_data):
        resp = client.get("/games/", params={"category": "Action"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert all(g["category"] == "Action" for g in data)

    def test_list_games_filter_disabled(self, client, seed_data):
        resp = client.get("/games/", params={"status": "DISABLED"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Retired Game"

    def test_list_games_invalid_status_rejected(self, client, seed_data):
        resp = client.get("/games/", params={"status": "INVALID"})
        assert resp.status_code == 422

    def test_list_games_sorted_by_name(self, client, seed_data):
        resp = client.get("/games/")
        data = resp.json()
        names = [g["name"] for g in data]
        assert names == sorted(names)

    def test_list_games_response_shape(self, client, seed_data):
        resp = client.get("/games/")
        data = resp.json()
        for item in data:
            assert "id" in item
            assert "name" in item
            assert "category" in item
            assert "thumbnail_url" in item
            assert "status" in item


class TestGetGame:
    def test_get_existing_game(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.get(f"/games/{game_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Beat Saber"
        assert data["category"] == "Action"
        assert "visit_count" in data
        assert "created_at" in data

    def test_get_nonexistent_game_returns_404(self, client):
        resp = client.get("/games/9999")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Game not found"


class TestRecordVisit:
    def test_visit_increments_counter(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.get(f"/games/{game_id}")
        initial = resp.json()["visit_count"]

        resp = client.post(f"/games/{game_id}/visit")
        assert resp.status_code == 200
        assert resp.json()["visit_count"] == initial + 1

    def test_visit_increments_multiple_times(self, client, seed_data):
        game_id = seed_data["games"][0].id
        for i in range(3):
            client.post(f"/games/{game_id}/visit")
        resp = client.get(f"/games/{game_id}")
        assert resp.json()["visit_count"] == 3

    def test_visit_nonexistent_game_returns_404(self, client):
        resp = client.post("/games/9999/visit")
        assert resp.status_code == 404


class TestGameInstallations:
    def test_list_installations(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.get(f"/games/{game_id}/installations")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3  # 3 installations for Beat Saber

    def test_installations_have_status(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.get(f"/games/{game_id}/installations")
        data = resp.json()
        statuses = {i["installation_status"] for i in data}
        assert "ACTIVE" in statuses
        assert "EXPIRING_SOON" in statuses
        assert "EXPIRED" in statuses

    def test_active_only_filter(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.get(f"/games/{game_id}/installations", params={"active_only": True})
        assert resp.status_code == 200
        data = resp.json()
        # Should exclude the expired one
        assert all(i["installation_status"] != "EXPIRED" for i in data)
        assert len(data) == 2

    def test_installations_response_shape(self, client, seed_data):
        game_id = seed_data["games"][0].id
        resp = client.get(f"/games/{game_id}/installations")
        data = resp.json()
        for inst in data:
            assert "id" in inst
            assert "game_id" in inst
            assert "headset_id" in inst
            assert "headset_code" in inst
            assert "headset_model" in inst
            assert "install_date" in inst
            assert "expiry_date" in inst
            assert "installation_status" in inst

    def test_installations_nonexistent_game(self, client):
        resp = client.get("/games/9999/installations")
        assert resp.status_code == 404
