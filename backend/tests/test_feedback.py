"""Tests for the /feedback endpoints."""


class TestSubmitFeedback:
    def test_submit_feedback(self, client):
        resp = client.post("/feedback/", json={
            "game_title": "Half-Life: Alyx",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["game_title"] == "Half-Life: Alyx"
        assert "id" in data
        assert "submitted_at" in data

    def test_submit_feedback_strips_whitespace(self, client):
        resp = client.post("/feedback/", json={
            "game_title": "  Pistol Whip  ",
        })
        assert resp.status_code == 201
        assert resp.json()["game_title"] == "Pistol Whip"

    def test_submit_feedback_missing_title(self, client):
        resp = client.post("/feedback/", json={})
        assert resp.status_code == 422


class TestListFeedback:
    def test_list_feedback_empty(self, client):
        resp = client.get("/feedback/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_feedback_with_data(self, client):
        client.post("/feedback/", json={"game_title": "Game A"})
        client.post("/feedback/", json={"game_title": "Game B"})
        client.post("/feedback/", json={"game_title": "Game C"})

        resp = client.get("/feedback/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3

    def test_list_feedback_order(self, client):
        client.post("/feedback/", json={"game_title": "First"})
        client.post("/feedback/", json={"game_title": "Second"})

        resp = client.get("/feedback/")
        data = resp.json()
        # Should be ordered by submitted_at desc (newest first)
        assert data[0]["game_title"] == "Second"
        assert data[1]["game_title"] == "First"
