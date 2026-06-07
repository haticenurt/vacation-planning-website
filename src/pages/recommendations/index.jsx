import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BedDouble, CalendarDays, Plane, TicketCheck, UsersRound } from "lucide-react";

/* eslint-disable react/prop-types */

const budgetLabels = {
    cheap: {
        title: "Ucuz",
        eyebrow: "Ekonomik paketler",
        accent: "text-emerald-700",
        button: "bg-emerald-600 hover:bg-emerald-700",
    },
    medium: {
        title: "Orta",
        eyebrow: "Dengeli paketler",
        accent: "text-sky-700",
        button: "bg-sky-600 hover:bg-sky-700",
    },
    comfort: {
        title: "Konfor",
        eyebrow: "Rahat paketler",
        accent: "text-violet-700",
        button: "bg-violet-600 hover:bg-violet-700",
    },
};

const formatCurrency = value => {
    if (typeof value !== "number") return "-";

    return `${value.toLocaleString("tr-TR")} TL`;
};

const getStoredRecommendations = () => {
    try {
        const storedData = JSON.parse(localStorage.getItem("tripRecommendations") || "{}");

        return {
            search: storedData.search || {},
            recommendations: Array.isArray(storedData.recommendations)
                ? storedData.recommendations
                : [],
            budgetType: storedData.budgetType,
        };
    } catch {
        return {
            search: {},
            recommendations: [],
            budgetType: "",
        };
    }
};

const getRecommendationTitle = (recommendation, index) => (
    recommendation.title ||
    recommendation.name ||
    `Paket ${index + 1}`
);

export default function RecommendationsPage({ budgetType }) {
    const storedData = useMemo(getStoredRecommendations, []);
    const pageBudgetType = budgetType || storedData.budgetType;
    const pageMeta = budgetLabels[pageBudgetType] || budgetLabels.medium;
    const recommendations = storedData.budgetType === pageBudgetType
        ? storedData.recommendations
        : [];
    const [selectedIndex, setSelectedIndex] = useState(0);
    const selectedRecommendation = recommendations[selectedIndex];
    const flight = selectedRecommendation?.flight || {};
    const hotel = selectedRecommendation?.hotel || {};
    const search = storedData.search || {};
    const flightBookingUrl = flight.bookingUrl || flight.bookingLink || flight.link || "";
    const canBookFlight = Boolean(flightBookingUrl || flight.bookingToken);

    const handleFlightReservation = () => {
        if (flightBookingUrl) {
            window.open(flightBookingUrl, "_blank", "noopener,noreferrer");
            return;
        }

        if (flight.bookingToken) {
            alert(`Ucak rezervasyon tokeni: ${flight.bookingToken}`);
            return;
        }

        alert("Bu ucus icin backend rezervasyon linki veya bookingToken dondurmedi.");
    };

    if (!recommendations.length) {
        return (
            <main className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-16">
                <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950">
                        <ArrowLeft size={17} />
                        Ana sayfaya don
                    </Link>
                    <h1 className="mt-8 text-3xl font-black text-slate-950">
                        Bu sayfa için kayıtlı paket bulunamadı.
                    </h1>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                        Type sayfasından bir bütçe kartı seçerek önerileri tekrar oluşturabilirsin.
                    </p>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-10 text-slate-950">
            <section className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <Link to="/" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950">
                            <ArrowLeft size={17} />
                            Ana sayfaya don
                        </Link>
                        <p className={`mt-6 text-sm font-black uppercase tracking-wide ${pageMeta.accent}`}>
                            {pageMeta.eyebrow}
                        </p>
                        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
                            {pageMeta.title} secim onerileri
                        </h1>
                    </div>

                    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-600 shadow-sm sm:grid-cols-3">
                        <span className="inline-flex items-center gap-2">
                            <Plane size={17} />
                            {search.fromAirport || search.from} - {search.toAirport || search.to}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <CalendarDays size={17} />
                            {search.startDate} / {search.endDate}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <UsersRound size={17} />
                            {search.peopleCount} kişi
                        </span>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {recommendations.slice(0, 3).map((recommendation, index) => (
                        <button
                            key={recommendation.rank || recommendation.title || index}
                            type="button"
                            onClick={() => setSelectedIndex(index)}
                            className={`min-h-64 rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                                selectedIndex === index
                                    ? "border-slate-950 ring-2 ring-slate-950/10"
                                    : "border-slate-200"
                            }`}
                        >
                            <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                                Paket {index + 1}
                            </span>
                            <h2 className="mt-3 text-2xl font-black text-slate-950">
                                {getRecommendationTitle(recommendation, index)}
                            </h2>
                            <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-slate-600">
                                {recommendation.reason || "Bu paket seçilen bütçeye göre hazırlanmıştır."}
                            </p>
                            <p className="mt-5 text-xl font-black text-slate-950">
                                {formatCurrency(recommendation.totalPrice)}
                            </p>
                        </button>
                    ))}
                </div>

                {selectedRecommendation && (
                    <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr_0.8fr]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-700">
                                    <Plane size={21} />
                                </span>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                        uçak detayi
                                    </p>
                                    <h3 className="text-xl font-black text-slate-950">
                                        {flight.airline || "Havayolu"}
                                    </h3>
                                </div>
                            </div>

                            <dl className="mt-6 grid gap-3 text-sm">
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="font-bold text-slate-500">Rota</dt>
                                    <dd className="font-black text-slate-950">{flight.departureAirport} - {flight.arrivalAirport}</dd>
                                </div>
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="font-bold text-slate-500">Kalkis</dt>
                                    <dd className="font-black text-slate-950">{flight.departureTime || "-"}</dd>
                                </div>
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="font-bold text-slate-500">Varis</dt>
                                    <dd className="font-black text-slate-950">{flight.arrivalTime || "-"}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="font-bold text-slate-500">Ucret</dt>
                                    <dd className="font-black text-slate-950">{formatCurrency(flight.price)}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <BedDouble size={21} />
                                </span>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                                        Otel detayı
                                    </p>
                                    <h3 className="text-xl font-black text-slate-950">
                                        {hotel.name || "Otel"}
                                    </h3>
                                </div>
                            </div>

                            <dl className="mt-6 grid gap-3 text-sm">
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="font-bold text-slate-500">Puan</dt>
                                    <dd className="font-black text-slate-950">{hotel.rating || "-"} / 5</dd>
                                </div>
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="font-bold text-slate-500">Yildiz</dt>
                                    <dd className="font-black text-slate-950">{hotel.stars || "-"} </dd>
                                </div>
                                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                                    <dt className="font-bold text-slate-500">Gecelik</dt>
                                    <dd className="font-black text-slate-950">{formatCurrency(hotel.price)}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="font-bold text-slate-500">Toplam otel</dt>
                                    <dd className="font-black text-slate-950">{formatCurrency(hotel.totalPrice)}</dd>
                                </div>
                            </dl>
                        </div>

                        <aside className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
                                <TicketCheck size={21} />
                            </span>
                            <h3 className="mt-5 text-2xl font-black">
                                Rezervasyon sayfası
                            </h3>
                            <p className="mt-3 text-sm font-semibold leading-6 text-white/70">
                                Secilen paket icin ucak ve otel rezervasyon adimlari burada baslar.
                            </p>
                            <p className="mt-6 text-3xl font-black">
                                {formatCurrency(selectedRecommendation.totalPrice)}
                            </p>

                            <button
                                type="button"
                                onClick={handleFlightReservation}
                                disabled={!canBookFlight}
                                className={`mt-6 h-12 w-full rounded-xl text-sm font-black text-white transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/60 ${pageMeta.button}`}
                            >
                                {canBookFlight ? "Ucagi rezerve et" : "Ucus linki bekleniyor"}
                            </button>
                            {hotel.link ? (
                                <a
                                    href={hotel.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-black text-slate-950 transition hover:bg-slate-100"
                                >
                                    Oteli rezerve et
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    className="mt-3 h-12 w-full rounded-xl bg-white/10 text-sm font-black text-white"
                                >
                                    Otel linki bekleniyor
                                </button>
                            )}
                        </aside>
                    </section>
                )}
            </section>
        </main>
    );
}
