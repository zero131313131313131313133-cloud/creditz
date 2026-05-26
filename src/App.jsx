import { useState, useEffect } from "react";
import "./App.css";

const countryNames = {
  KR: "한국",
  JP: "일본",
  US: "미국",
  CN: "중국",
  VN: "베트남"
};

const ottLogos = {
  Netflix:
    "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",

  "Disney Plus":
    "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg",

  Watcha:
    "https://static.watcha.com/static/images/bi/watcha_pedia/logo.svg",

  Hulu:
    "https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg",

  wavve:
    "https://upload.wikimedia.org/wikipedia/commons/1/19/Wavve_logo.svg",

  iQIYI:
    "https://upload.wikimedia.org/wikipedia/commons/e/e7/IQIYI_logo.svg",

  VIU:
    "https://upload.wikimedia.org/wikipedia/commons/7/71/Viu_logo.svg"
};

export default function App() {

  const [query, setQuery] = useState("");
  const [actor, setActor] = useState(null);
  const [films, setFilms] = useState([]);
  const [country, setCountry] = useState("KR");
  const [loading, setLoading] = useState(false);
  const [translatedBio, setTranslatedBio] = useState("");

  const API_KEY =
    import.meta.env.VITE_TMDB_API_KEY;

  const searchActor = async () => {

    if (!query) return;

    setLoading(true);

    try {

      const actorRes = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${query}&language=ko-KR`
      );

      const actorData = await actorRes.json();

      const selectedActor =
        actorData.results[0];

      setActor(selectedActor);

      const detailRes = await fetch(
        `https://api.themoviedb.org/3/person/${selectedActor.id}?api_key=${API_KEY}&language=ko-KR`
      );
      
      let detailData = await detailRes.json();

      if (!detailData.biography) {
      
        const englishRes = await fetch(
          `https://api.themoviedb.org/3/person/${selectedActor.id}?api_key=${API_KEY}&language=en-US`
        );
      
        detailData = await englishRes.json();
      
      }
      
      setActor(detailData);

      if (detailData.biography) {

        const translated =
          await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&dt=t&q=${encodeURIComponent(detailData.biography)}`
          );
      
        const translatedData =
          await translated.json();
      
        const result =
          translatedData[0]
            .map((item) => item[0])
            .join("");
      
        setTranslatedBio(result);
      
      }
      const creditRes = await fetch(
        `https://api.themoviedb.org/3/person/${selectedActor.id}/combined_credits?api_key=${API_KEY}&language=ko-KR`
      );

      const creditData = await creditRes.json();

      const sorted =
        creditData.cast.sort(
          (a, b) =>
            b.popularity - a.popularity
        );

      setFilms(sorted);

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

          <div>

            <h2>
              {actor.name}
            </h2>

            <p>
              대표작 포함 전체 필모그래피
            </p>

            <p className="biography">

{
  translatedBio
    ? translatedBio.slice(0, 300)
    : "배우 소개 정보가 없습니다."
}

</p>
          </div>

        </div>

      )}

      <div className="film-grid">

        {films.map((film, index) => (

          <FilmCard
            key={film.credit_id}
            film={film}
            country={country}
            apiKey={API_KEY}
            featured={index < 3}
          />

        ))}

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

    const mediaType = film.media_type;

    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${film.id}/watch/providers?api_key=${apiKey}`
    );

    const data = await res.json();

    if (data.results) {

      setProviders(data.results);

    }

  } catch (error) {

    console.error(error);

  }

};

    KR: {
      flatrate: [
        { provider_id: 1, provider_name: "Netflix" },
        { provider_id: 2, provider_name: "Watcha" },
        { provider_id: 3, provider_name: "wavve" }
      ]
    },

    JP: {
      flatrate: [
        { provider_id: 1, provider_name: "Netflix" },
        { provider_id: 2, provider_name: "Disney Plus" }
      ]
    },

    US: {
      flatrate: [
        { provider_id: 1, provider_name: "Netflix" },
        { provider_id: 2, provider_name: "Hulu" }
      ]
    },

    CN: {
      flatrate: [
        { provider_id: 1, provider_name: "iQIYI" }
      ]
    },

    VN: {
      flatrate: [
        { provider_id: 1, provider_name: "VIU" },
        { provider_id: 2, provider_name: "Netflix" }
      ]
    }

  });

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
        />

      )}

      <h3>
        {film.title || film.name}
      </h3>

      <p>

        <strong>배역:</strong>

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

      <button onClick={loadProviders}>
        OTT 보기
      </button>

      {
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