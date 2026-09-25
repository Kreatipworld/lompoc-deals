from . import deal_promo, event_promo, flyer_story, game_night, game_night_card, game_night_town, game_result, master_story, member_spotlight, news_recap, number_ad, season_recap

REGISTRY = {
    "deal-promo": deal_promo,
    "event-promo": event_promo,
    "game-night": game_night,
    "game-night-card": game_night_card,
    "game-night-town": game_night_town,
    "flyer-story": flyer_story,
    "game-result": game_result,
    "number-ad": number_ad,
    "master-story": master_story,
    "member-spotlight": member_spotlight,
    "news-recap": news_recap,
    "season-recap": season_recap,
}
