"""Tests for ORM models and their computed properties."""

from models import Game, Headset, Session as SessionModel
from models import GameCategory, GameStatus, VALID_DURATIONS


class TestGameModel:
    def test_game_creation(self, db):
        game = Game(
            name="Test Game",
            description="A test game.",
            category=GameCategory.ACTION,
            thumbnail_url="https://example.com/test.jpg",
            status=GameStatus.ACTIVE,
        )
        db.add(game)
        db.commit()
        db.refresh(game)
        assert game.id is not None
        assert game.name == "Test Game"
        assert game.visit_count == 0

    def test_game_default_values(self, db):
        game = Game(
            name="Defaults",
            category=GameCategory.OTHER,
            thumbnail_url="",
        )
        db.add(game)
        db.commit()
        db.refresh(game)
        assert game.is_multiplayer is False
        assert game.visit_count == 0
        assert game.created_at is not None


class TestHeadsetModel:
    def test_headset_creation(self, db):
        headset = Headset(code="TEST1", model="Meta Quest 3")
        db.add(headset)
        db.commit()
        db.refresh(headset)
        assert headset.id is not None
        assert headset.is_active is True


class TestGameInstallationModel:
    def test_active_installation(self, db, seed_data):
        inst = seed_data["installations"][0]  # active, 90 days
        assert inst.is_expired is False
        assert inst.is_expiring_soon is False

    def test_expiring_soon_installation(self, db, seed_data):
        inst = seed_data["installations"][1]  # 5 days left
        assert inst.is_expired is False
        assert inst.is_expiring_soon is True

    def test_expired_installation(self, db, seed_data):
        inst = seed_data["installations"][2]  # expired 2 days ago
        assert inst.is_expired is True
        assert inst.is_expiring_soon is False


class TestSessionModel:
    def test_generate_session_code_format(self):
        code = SessionModel.generate_session_code()
        assert code.startswith("DZ-")
        parts = code.split("-")
        assert len(parts) == 3
        assert len(parts[1]) == 8  # date part YYYYMMDD
        assert len(parts[2]) == 4  # hex suffix

    def test_generate_session_code_uniqueness(self):
        codes = {SessionModel.generate_session_code() for _ in range(100)}
        assert len(codes) == 100

    def test_valid_durations(self):
        assert VALID_DURATIONS == {10, 30, 45, 60}
