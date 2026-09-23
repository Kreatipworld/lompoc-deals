from . import deal_promo, event_promo, game_night, game_result, member_spotlight, news_recap, season_recap

REGISTRY = {
    "deal-promo": deal_promo,
    "event-promo": event_promo,
    "game-night": game_night,
    "game-result": game_result,
    "member-spotlight": member_spotlight,
    "news-recap": news_recap,
    "season-recap": season_recap,
}
