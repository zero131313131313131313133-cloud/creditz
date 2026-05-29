import { useState } from "react";
import "./App.css";

const countryNames = {
  KR: "🇰🇷",
  JP: "🇯🇵",
  US: "🇺🇸",
  CN: "🇨🇳",
  VN: "🇻🇳"
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

      // 배우 검색
      const actorRes = await fetch(
        `https://api.themoviedb.org/3/search/person?api_key=${API_KEY}&query=${query}&language=ko-KR`
      );

      const actorData =
        await actorRes.json();

      const selectedActor =
        actorData.results[0];

      if (!selectedActor) {

        alert("배우를 찾을 수 없습니다.");
        return;

      }

      // 배우 상세
      const detailRes = await fetch(
        `https://api.themoviedb.org/3/person/${selectedActor.id}?api_key=${API_KEY}&language=ko-KR`
      );

      let detailData =
        await detailRes.json();

      // 소개 없으면 영어 데이터
      if (!detailData.biography) {

        const engRes = await fetch(
          `https://api.themoviedb.org/3/person/${selectedActor.id}?api_key=${API_KEY}&language=en-US`
        );

        detailData =
          await engRes.json();

      }

      // 이름은 한국어 유지
      setActor({
        ...detailData,
        name: selectedActor.name
      });

      // 소개 번역
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

      } else {

        setTranslatedBio("");

      }

      // 필모
      const creditRes = await fetch(
        `https://api.themoviedb.org/3/person/${selectedActor.id}/combined_credits?api_key=${API_KEY}&language=ko-KR`
      );

      const creditData =
        await creditRes.json();

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
          onKeyDown={(e) => {

            if (e.key === "Enter") {

              searchActor();

            }

          }}
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

          <p>
            불러오는 중...
          </p>

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

            <h2 className="actor-name">
              {actor.name}
            </h2>

            <p className="bio">

              {
                translatedBio
                  ? translatedBio
                      .replaceAll("\n", " ")
                      .slice(0, 300)
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

    const mediaType =
      film.media_type;

    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${film.id}/watch/providers?api_key=${apiKey}`
    );

    const data = await res.json();

    setProviders(data.results);
  };

  const selectedProviders =
    providers?.[country];

  const koreanProviders =
    providers?.KR;

  const allProviders = [

    ...(selectedProviders?.flatrate || []),
    ...(selectedProviders?.rent || []),
    ...(selectedProviders?.buy || []),

    ...(country !== "KR"
      ? [
          ...(koreanProviders?.flatrate || []),
          ...(koreanProviders?.rent || []),
          ...(koreanProviders?.buy || [])
        ]
      : [])

  ];

  // 중복 제거
  const uniqueProviders =
    allProviders.filter(
      (provider, index, self) =>
        index ===
        self.findIndex(
          (p) =>
            p.provider_id ===
            provider.provider_id
        )
    );

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

    <img
  src={
    film.poster_path
      ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
      : "https://dummyimage.com/500x750/1a1a1a/ffffff&text=NO+IMAGE"
  }
  className="poster"
/>

      <h3>
        {film.title || film.name}
      </h3>

  {
  film.character &&
  film.character !== "Self" &&
  film.character !== "Himself" &&
  film.character !== "Herself" && (

    <p className="character">

      <strong>배역:</strong>

      {" "}

      {film.character}

    </p>

  )
}

      {
  film.overview &&
  film.overview.length > 30 && (

    <p className="overview">

      {film.overview.slice(0, 120)}

    </p>

  )
}

      <button onClick={loadProviders}>
        OTT 보기
      </button>

      {uniqueProviders.length > 0 && (

        <div className="ott-list">

          {uniqueProviders.map((p) => {

            const isKorean =
              koreanProviders &&
              [
                ...(koreanProviders.flatrate || []),
                ...(koreanProviders.rent || []),
                ...(koreanProviders.buy || [])
              ].some(
                (kp) =>
                  kp.provider_id ===
                  p.provider_id
              );

            return (

              <div
                className="ott-badge"
                key={p.provider_id}
              >

                {
                  isKorean
                    ? "🇰🇷"
                    : countryNames[country]
                }

                {" "}

                {p.provider_name}

              </div>

            );

          })}

        </div>

      )}

    </div>
  );
}