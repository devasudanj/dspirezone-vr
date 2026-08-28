"""Tests for the health-check root endpoint."""


class TestHealthCheck:
    def test_root_returns_ok(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "Dspire VR Zone API"

    def test_docs_endpoint_available(self, client):
        resp = client.get("/docs")
        assert resp.status_code == 200

    def test_redoc_endpoint_available(self, client):
        resp = client.get("/redoc")
        assert resp.status_code == 200
