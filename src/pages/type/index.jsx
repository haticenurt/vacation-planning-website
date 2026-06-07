import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const RECOMMEND_URL = "https://vacation-planning-website-backend.onrender.com/api/trips/recommend";

const travelTypes = [
    {
        title: "Ucuz",
        description: "Bütçe dostu seçeneklerle en uygun yolculuğu bul.",
        price: "En ekonomik",
        category: "cheap",
        accent: "from-emerald-400 to-teal-500",
        glow: "group-hover:shadow-emerald-500/25",
        badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        surface: "from-emerald-50/90 via-white/75 to-teal-50/70",
    },
    {
        title: "Orta",
        description: "Fiyat ve konfor dengesini koruyan seçenekleri listele.",
        price: "Dengeli tercih",
        category: "medium",
        accent: "from-sky-400 to-blue-600",
        glow: "group-hover:shadow-sky-500/25",
        badge: "bg-sky-50 text-sky-700 ring-sky-200",
        surface: "from-sky-50/90 via-white/75 to-blue-50/70",
    },
    {
        title: "Konfor",
        description: "Daha rahat ve kaliteli yolculuk alternatiflerini seç.",
        price: "Rahat yolculuk",
        category: "comfort",
        accent: "from-violet-400 to-fuchsia-600",
        glow: "group-hover:shadow-violet-500/25",
        badge: "bg-violet-50 text-violet-700 ring-violet-200",
        surface: "from-violet-50/90 via-white/75 to-fuchsia-50/70",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.55,
            ease: "easeOut",
        },
    },
};

const cleanLocation = location => location?.replace(/\s*\([^)]*\)/g, "").trim() || "";

const readResponseJson = async response => {
    try {
        return await response.json();
    } catch {
        return {};
    }
};

const getErrorMessage = (data, status) => {
    if (typeof data.error === "string") {
        return data.error;
    }

    if (typeof data.detail === "string") {
        return data.detail;
    }

    if (Array.isArray(data.detail)) {
        return data.detail
            .map(error => error.msg || JSON.stringify(error))
            .join(", ");
    }

    return data.message || `Backend aramasi basarisiz oldu. (${status})`;
};

const normalizeDateValue = value => {
    if (!value) return "";

    if (/^\d{4}-\d{2}$/.test(value)) {
        return `${value}-01`;
    }

    return value;
};

const isFullDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value);

const parseRecommendationString = recommendations => {
    try {
        return JSON.parse(recommendations.replace(/```json|```/g, "").trim());
    } catch {
        return [recommendations];
    }
};

const normalizeRecommendations = data => {
    const recommendations = typeof data.recommendations === "string"
        ? parseRecommendationString(data.recommendations)
        : data.recommendations;

    if (Array.isArray(recommendations)) {
        return recommendations;
    }

    if (recommendations && typeof recommendations === "object") {
        return [recommendations];
    }

    return data.packages || [];
};

export default function Type(){
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleCategorySelect = async category => {
        const savedTripInfo = localStorage.getItem("tripInfo");

        if (!savedTripInfo) {
            setMessage("Önce uçuş arama bilgilerini doldurmalısın.");
            return;
        }

        let tripInfo;

        try {
            tripInfo = JSON.parse(savedTripInfo);
        } catch {
            setMessage("Kayıtlı uçuş bilgisi okunamadı. Lütfen tekrar arama yap.");
            return;
        }

        setSelectedCategory(category);
        setIsLoading(true);
        setMessage("");

        try {
            const from = cleanLocation(tripInfo.from);
            const to = cleanLocation(tripInfo.to);
            const startDate = normalizeDateValue(tripInfo.date || tripInfo.startDate || "");
            const endDate = normalizeDateValue(tripInfo.returnDate || tripInfo.endDate || startDate);
            const peopleCount = Number(tripInfo.passengers) || 1;

            if (!from || !to || !startDate || !endDate || !peopleCount || !category) {
                throw new Error("Backend istegi icin gerekli alanlar eksik.");
            }

            if (from.toLowerCase() === to.toLowerCase()) {
                throw new Error("Kalkis ve varis sehri ayni olamaz.");
            }

            if (!isFullDate(startDate) || !isFullDate(endDate)) {
                throw new Error("Tarih formati YYYY-MM-DD olmali.");
            }

            const response = await fetch(RECOMMEND_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from,
                    to,
                    startDate,
                    endDate,
                    peopleCount,
                    budgetType: category,
                }),
            });

            const data = await readResponseJson(response);

            if (!response.ok) {
                throw new Error(getErrorMessage(data, response.status));
            }

            const recommendations = normalizeRecommendations(data);

            if (!recommendations.length) {
                setMessage("Bu kategoride uygun paket bulunamadi.");
                return;
            }

            localStorage.setItem(
                "tripRecommendations",
                JSON.stringify({
                    budgetType: category,
                    search: data.search || {
                        from,
                        to,
                        startDate,
                        endDate,
                        peopleCount,
                        budgetType: category,
                    },
                    recommendations,
                })
            );

            navigate(`/${category}`, { replace: true });
        } catch (error) {
            setMessage(error.message || "Arama sırasında bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return(
        <main className="relative min-h-screen overflow-x-hidden bg-slate-950 px-4 py-24 text-slate-950 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.22),transparent_32%),linear-gradient(135deg,#eef6ff_0%,#f8fafc_42%,#f4f0ff_100%)]" />
            <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-white/50 to-transparent backdrop-blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-slate-950/15 to-transparent" />

            <section className="relative z-10 mx-auto flex min-h-[calc(100vh-12rem)] max-w-6xl flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="mx-auto mb-12 max-w-3xl text-center"
                >
                    <span className="inline-flex rounded-full border border-white/70 bg-white/55 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm backdrop-blur-xl">
                        Yolculuk tipi
                    </span>
                    <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                        Nasil bir yolculuk istersin?
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
                        Önceligini seç, sana uygun rota ve ulaşım seçeneklerini ona göre hazırlayalım.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid gap-6 md:grid-cols-3"
                >
                    {travelTypes.map(type => (
                        <motion.div
                            key={type.title}
                            variants={itemVariants}
                            whileHover={{ y: -10, scale: 1.025 }}
                            whileTap={{ scale: 0.99 }}
                            className="group"
                        >
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleCategorySelect(type.category)}
                                className={`relative flex min-h-96 w-full overflow-hidden rounded-2xl border border-white/70 bg-linear-to-br ${type.surface} p-6 text-left shadow-2xl shadow-slate-900/10 backdrop-blur-2xl transition duration-300 disabled:cursor-wait disabled:opacity-75 ${type.glow}`}
                            >
                                <div className={`absolute inset-x-6 top-0 h-px bg-linear-to-r ${type.accent} opacity-70`} />
                                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/55 transition group-hover:ring-white/90" />

                                <div className="relative flex w-full flex-col justify-between">
                                    <div>
                                        <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide ring-1 ${type.badge}`}>
                                            {type.price}
                                        </span>

                                        <div className={`mt-7 h-12 w-12 rounded-2xl bg-linear-to-br ${type.accent} shadow-lg shadow-slate-950/10`} />

                                        <h2 className="mt-7 text-4xl font-black tracking-tight text-slate-950">
                                            {type.title}
                                        </h2>
                                        <p className="mt-4 text-sm font-medium leading-7 text-slate-600">
                                            {type.description}
                                        </p>
                                    </div>

                                    <span className="mt-10 inline-flex h-13 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/20 transition duration-300 group-hover:bg-slate-900 group-hover:shadow-xl group-hover:shadow-slate-950/30">
                                        {isLoading && selectedCategory === type.category ? "Araniyor" : "Sec"}
                                    </span>
                                </div>
                            </button>
                        </motion.div>
                    ))}
                </motion.div>

                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="mt-10 rounded-2xl border border-white/70 bg-white/70 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl"
                    >
                        <p className="text-sm font-bold text-slate-700">
                            {message}
                        </p>
                    </motion.div>
                )}
            </section>
        </main>
    );
}
