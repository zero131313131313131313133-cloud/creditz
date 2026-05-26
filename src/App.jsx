import { useState } from "react";
import "./App.css";

const countryNames = {
  KR: "한국",
  JP: "일본",
  US: "미국",
  CN: "중국",
  VN: "베트남"
};

export default function App() {

  const [query, setQuery] = useState("");
  const [actor, setActor] = useState(null);
  const [films, setFilms] = useState([]);
  const [country, setCountry] = useState("KR");
  const [loading, setLoading] = useState(false);

  const API_KEY =
    import.meta.env.VITE_TMDB_API_KEY;

  const searchActor = async () => {

    if (!query) return;

    setLoading(true);

    try {

      // 배우 검색
      const actorRes = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${query}&language=ko-KR`
      );

      const actorData = await actorRes.json();

      if (!actorData.results.length) {

        setActor(null);
        setFilms([]);

        return;
      }

      const selectedActor =
        actorData.results[0];

      // 배우 상세 정보
      let detailRes = await fetch(
        `https://api.themoviedb.org/3/person/${selectedActor.id}?api_key=${API_KEY}&language=ko-KR`
      );

      let detailData =
        await detailRes.json();

      // 한국어 소개 없으면 영어 가져오기
      if (!detailData.biography) {

        detailRes = await fetch(
          `https://api.themoviedb.org/3/person/${selectedActor.id}?api_key=${API_KEY}&language=en-US`
        );

        detailData =
          await detailRes.json();
      }

      setActor(detailData);

      // 필모그래피 가져오기
      const creditRes = await fetch(
        `https://api.themoviedb.org/3/person/${selectedActor.id}/combined_credits?api_key=${API_KEY}&language=ko-KR`
      );

      const creditData =
        await creditRes.json();

      const sortedFilms =
        creditData.cast
          .filter((item) => item.poster_path)
          .sort(
            (a, b) =>
              b.popularity - a.popularity
          );

      setFilms(sortedFilms);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="container">

      <h1 className="title">
        🎬 Global Actor Archive
      </h1>

      <div className="search-area">

        <input
          type="text"
          placeholder="배우 이름 검색"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
        />

        <button onClick={searchActor}>
          검색
        </button>

        <select
          value={country}
          onChange={(e) =>
            setCountry(e.target.value)
          }
        >

          <option value="KR">
            🇰🇷 한국
          </option>

          <option value="JP">
            🇯🇵 일본
          </option>

          <option value="US">
            🇺🇸 미국
          </option>

          <option value="CN">
            🇨🇳 중국
          </option>

          <option value="VN">
            🇻🇳 베트남
          </option>

        </select>

      </div>

      {loading && (

        <div className="loading">

          <div className="spinner"></div>

          <p>필모그래피 불러오는 중...</p>

        </div>

      )}

      {actor && (

        <div className="actor-profile">

          {actor.profile_path && (

            <img
              src={`https://image.tmdb.org/t/p/w500${actor.profile_path}`}
              className="actor-image"
            />

          )}

          <div className="actor-info">

            <h2>
              {actor.name}
            </h2>

            <p className="sub-title">
              대표작 포함 전체 필모그래피
            </p>

            <p className="biography">

              {
                actor.biography
                  ? actor.biography
                      .replaceAll("\n", " ")
                      .slice(0, 400)
                  : "배우 소개 정보가 없습니다."
              }

            </p>

          </div>

        </div>

      )}

      <div className="film-grid">

        {
          films.map((film, index) => (

            <FilmCard
              key={film.credit_id}
              film={film}
              country={country}
              apiKey={API_KEY}
              featured={index < 3}
            />

          ))
        }

      </div>

    </div>

  );
}

function FilmCard({
  film,
  country,
  apiKey,
  featured
}) {

  const [providers, setProviders] =
    useState(null);

  const loadProviders = async () => {

    if (providers) return;

    try {

      const mediaType =
        film.media_type;

      const res = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${film.id}/watch/providers?api_key=${apiKey}`
      );

      const data =
        await res.json();

      setProviders(data.results);

    } catch (error) {

      console.error(error);

    }

  };

  return (

    <div
      className={
        featured
          ? "film-card featured"
          : "film-card"
      }
    >

      {featured && (

        <div className="featured-badge">
          대표작
        </div>

      )}

      {film.poster_path && (

        <img
          src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
          className="poster"
        />

      )}

      <h3>
        {film.title || film.name}
      </h3>

      <p className="character">

        배역 :
        {" "}
        {film.character || "정보 없음"}

      </p>

      <p className="overview">

        {
          film.overview
            ? film.overview.slice(0, 120)
            : "줄거리 없음"
        }

      </p>

      <button
        className="ott-button"
        onClick={loadProviders}
      >
        OTT 보기
      </button>

      {
        providers &&
        providers[country] &&
        (
          providers[country].flatrate ||
          providers[country].rent ||
          providers[country].buy
        ) && (

          <div className="ott-box">

            <p>
              {countryNames[country]} OTT
            </p>

            <div className="ott-logos">

              {
                (
                  providers[country].flatrate ||
                  providers[country].rent ||
                  providers[country].buy
                ).map((p) => (

                  <div
                    key={p.provider_id}
                    className="ott-badge"
                  >
                    {p.provider_name}
                  </div>

                ))
              }

            </div>

          </div>

        )
      }

    </div>

  );
}