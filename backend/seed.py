"""
seed.py
-------
Populates the database with sample games, headsets, and installations
for development and demo purposes.

Run with:
    python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta
from database import engine, Base, SessionLocal
from models import Game, Headset, GameInstallation, GameCategory, GameStatus

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

GAMES = [
    {
        "name": "Beat Saber",
        "description": "Slash beats to the rhythm with your virtual light sabers.",
        "category": GameCategory.ACTION,
        "thumbnail_url": "https://dspirevr.blob.core.windows.net/game-media/games/1/thumbnail/beat_saber.jpg",
        "video_url": None,
        "status": GameStatus.ACTIVE,
    },
    {
        "name": "Superhot VR",
        "description": "Time moves only when you move – a unique tactical shooter.",
        "category": GameCategory.ACTION,
        "thumbnail_url": "https://dspirevr.blob.core.windows.net/game-media/games/2/thumbnail/superhot.jpg",
        "video_url": None,
        "status": GameStatus.ACTIVE,
    },
    {
        "name": "Gorilla Tag",
        "description": "Run, climb and tag other gorillas using your hands only.",
        "category": GameCategory.ADVENTURE,
        "thumbnail_url": "https://dspirevr.blob.core.windows.net/game-media/games/3/thumbnail/gorilla_tag.jpg",
        "video_url": None,
        "status": GameStatus.ACTIVE,
    },
    {
        "name": "Moss",
        "description": "Guide a tiny mouse named Quill through a magical world.",
        "category": GameCategory.ADVENTURE,
        "thumbnail_url": "https://dspirevr.blob.core.windows.net/game-media/games/4/thumbnail/moss.jpg",
        "video_url": None,
        "status": GameStatus.ACTIVE,
    },
    {
        "name": "Job Simulator",
        "description": "In a world where robots have replaced all human jobs, experience what it was like 'to job'.",
        "category": GameCategory.SIMULATION,
        "thumbnail_url": "https://dspirevr.blob.core.windows.net/game-media/games/5/thumbnail/job_simulator.jpg",
        "video_url": None,
        "status": GameStatus.ACTIVE,
    },
    {
        "name": "Richie's Plank Experience",
        "description": "Walk the plank 80 floors above a city. Safe but terrifying.",
        "category": GameCategory.HORROR,
        "thumbnail_url": "https://dspirevr.blob.core.windows.net/game-media/games/6/thumbnail/richies_plank.jpg",
        "video_url": None,
        "status": GameStatus.ACTIVE,
    },
    {
        "name": "VR Dinosaurs",
        "description": (
            "Come face to face with life-size dinosaurs in stunning prehistoric environments."
        ),
        "category": GameCategory.EDUCATIONAL,
        "thumbnail_url": "https://dspirevr.blob.core.windows.net/game-media/games/7/thumbnail/vr_dinos.jpg",
        "video_url": None,
        "status": GameStatus.ACTIVE,
    },
    {
        "name": "Five Nights at Freddy's VR",
        "description": "Survive the night against terrifying animatronics.",
        "category": GameCategory.HORROR,
        "thumbnail_url": "https://dspirevr.blob.core.windows.net/game-media/games/8/thumbnail/fnaf_vr.jpg",
        "video_url": None,
        "status": GameStatus.ACTIVE,
    },
    {
        "name": "Fruit Ninja VR",
        "description": "Slice fruit that is flung into the air before it hits the ground.",
        "category": GameCategory.KIDS,
        "thumbnail_url": "https://dspirevr.blob.core.windows.net/game-media/games/9/thumbnail/fruit_ninja.jpg",
        "video_url": None,
        "status": GameStatus.ACTIVE,
    },
    {
        "name": "Sports Scramble",
        "description": "Mashup sports with unexpected rules – giant baseball rackets and tiny tennis balls.",
        "category": GameCategory.SPORTS,
        "thumbnail_url": "https://dspirevr.blob.core.windows.net/game-media/games/10/thumbnail/sports_scramble.jpg",
        "video_url": None,
        "status": GameStatus.ACTIVE,
    },
]

HEADSETS = [
    {"code": "DZ1", "model": "Meta Quest 3"},
    {"code": "DZ2", "model": "Meta Quest 3"},
    {"code": "DZ3", "model": "Meta Quest 3"},
    {"code": "DZ4", "model": "Meta Quest 3"},
    {"code": "DZ5", "model": "Meta Quest 3"},
    {"code": "DZ6", "model": "Meta Quest 2"},
]

# Which games are installed on which headsets plus expiry windows
# Format: (game_index, headset_code, days_until_expiry)
# Negative days_until_expiry simulates an already-expired installation
INSTALLATION_MAP = [
    (0, "DZ1", 90),   # Beat Saber on DZ1 – active
    (0, "DZ2", 5),    # Beat Saber on DZ2 – expiring soon
    (0, "DZ3", -2),   # Beat Saber on DZ3 – already expired
    (1, "DZ1", 120),  # Superhot on DZ1
    (1, "DZ2", 120),
    (1, "DZ4", 120),
    (2, "DZ3", 60),   # Gorilla Tag
    (2, "DZ4", 60),
    (2, "DZ5", 60),
    (3, "DZ1", 30),   # Moss
    (3, "DZ2", 30),
    (4, "DZ5", 90),   # Job Simulator
    (4, "DZ6", 90),
    (5, "DZ1", 180),  # Richie's Plank
    (5, "DZ2", 180),
    (5, "DZ3", 180),
    (6, "DZ4", 365),  # VR Dinosaurs (educational)
    (6, "DZ5", 365),
    (6, "DZ6", 365),
    (7, "DZ1", 45),   # FNAF VR
    (7, "DZ2", 45),
    (8, "DZ3", 60),   # Fruit Ninja
    (8, "DZ4", 60),
    (8, "DZ5", 60),
    (9, "DZ1", 30),   # Sports Scramble
    (9, "DZ6", 30),
]


def seed():
    db = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(Game).count() > 0:
            print("Database already contains data. Skipping seed.")
            return

        # Insert games
        game_objects = []
        for g in GAMES:
            game = Game(**g)
            db.add(game)
            game_objects.append(game)
        db.flush()  # Assign IDs without committing

        # Insert headsets
        headset_map: dict[str, Headset] = {}
        for h in HEADSETS:
            headset = Headset(**h)
            db.add(headset)
            headset_map[h["code"]] = headset
        db.flush()

        # Insert installations
        today = date.today()
        for game_idx, headset_code, days_offset in INSTALLATION_MAP:
            install = GameInstallation(
                game_id=game_objects[game_idx].id,
                headset_id=headset_map[headset_code].id,
                install_date=today - timedelta(days=30),
                expiry_date=today + timedelta(days=days_offset),
            )
            db.add(install)

        db.commit()
        print(f"Seeded {len(GAMES)} games, {len(HEADSETS)} headsets, {len(INSTALLATION_MAP)} installations.")
    except Exception as exc:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
