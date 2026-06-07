import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Minus,
    Plane,
    Plus,
    Search,
    Shuffle,
    UserRound,
} from "lucide-react";

/* eslint-disable react/prop-types */

const heroImage =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=85";

const tripTypes = ["Gidiş Dönüş", "Tek Yön", "Çoklu Uçuş"];

const cabinClasses = [
    "Ekonomi",
    "Premium Ekonomi",
    "Business",
    "First",
];

const monthNames = Array.from({ length: 12 }, (_, index) =>
    new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(
        new Date(2026, index, 1)
    )
);
const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cuma", "Cmt", "Paz"];

const formatMonth = date =>
    date
        ? date.toLocaleDateString("tr-TR", {
              month: "long",
              year: "numeric",
          })
        : "Ay seç";

const formatDate = date =>
    date
        ? date.toLocaleDateString("tr-TR", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "Tarih seç";

const toDateValue = date => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const toMonthValue = date => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
};

const isSameDay = (firstDate, secondDate) =>
    firstDate &&
    secondDate &&
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate();

const isBetweenDates = (date, startDate, endDate) => {
    if (!date || !startDate || !endDate) return false;

    const time = date.setHours(0, 0, 0, 0);
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(0, 0, 0, 0);

    return time > Math.min(start, end) && time < Math.max(start, end);
};

const buildCalendarDays = monthDate => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    return [
        ...Array.from({ length: mondayOffset }, () => null),
        ...Array.from(
            { length: totalDays },
            (_, index) => new Date(year, month, index + 1)
        ),
    ];
};

function DatePicker({
    tripType,
    dateMode,
    departureDate,
    returnDate,
    departureMonth,
    returnMonth,
    onSelectDeparture,
    onSelectReturn,
    onSelectDepartureMonth,
    onSelectReturnMonth,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeField, setActiveField] = useState("departure");
    const [visibleMonth, setVisibleMonth] = useState(
        new Date(2026, 4, 1)
    );
    const [isMonthPickerOpen, setIsMonthPickerOpen] =
        useState(false);

    const getFieldValue = field => {
        if (dateMode === "month") {
            return field === "departure"
                ? formatMonth(departureMonth)
                : formatMonth(returnMonth);
        }

        return field === "departure"
            ? formatDate(departureDate)
            : formatDate(returnDate);
    };

    const handleSelectDate = date => {
        if (activeField === "departure") {
            onSelectDeparture(date);

            if (tripType === "Tek Yön") {
                onSelectReturn(null);
                setIsOpen(false);
                return;
            }

            if (returnDate && date > returnDate) {
                onSelectReturn(null);
            }

            setActiveField("return");
            return;
        }

        onSelectReturn(date);
        setIsOpen(false);
    };

    const handleSelectMonth = monthIndex => {
        const selectedMonth = new Date(
            visibleMonth.getFullYear(),
            monthIndex,
            1
        );

        setVisibleMonth(selectedMonth);

        if (dateMode !== "month") {
            setIsMonthPickerOpen(false);
            return;
        }

        if (activeField === "departure") {
            onSelectDepartureMonth(selectedMonth);

            if (tripType === "Tek Yön") {
                onSelectReturnMonth(null);
                setIsOpen(false);
                return;
            }

            setActiveField("return");
            return;
        }

        onSelectReturnMonth(selectedMonth);
        setIsOpen(false);
    };

    const openCalendar = field => {
        setActiveField(field);
        setIsOpen(true);
        setIsMonthPickerOpen(false);
    };

    return (
        <div className="relative">
            <div className="grid gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => openCalendar("departure")}
                    className="group flex min-h-20 items-center gap-3 rounded-2xl border border-white/60 bg-white/85 px-4 text-left shadow-sm"
                >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                        <CalendarDays size={21} />
                    </span>

                    <span>
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Gidiş
                        </span>

                        <span className="mt-1 block text-base font-black text-slate-950">
                            {getFieldValue("departure")}
                        </span>
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => openCalendar("return")}
                    disabled={tripType === "Tek Yön"}
                    className="group flex min-h-20 items-center gap-3 rounded-2xl border border-white/60 bg-white/85 px-4 text-left shadow-sm disabled:opacity-50"
                >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                        <CalendarDays size={21} />
                    </span>

                    <span>
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Dönüş
                        </span>

                        <span className="mt-1 block text-base font-black text-slate-950">
                            {tripType === "Tek Yön"
                                ? "Gerekli değil"
                                : getFieldValue("return")}
                        </span>
                    </span>
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 8 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="absolute left-0 right-0 top-full z-30 mt-2 rounded-3xl border border-white/80 bg-white p-5 shadow-2xl"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() =>
                                    setVisibleMonth(
                                        new Date(
                                            visibleMonth.getFullYear(),
                                            visibleMonth.getMonth() - 1,
                                            1
                                        )
                                    )
                                }
                                className="grid h-9 w-9 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <span
                                onClick={() =>
                                    setIsMonthPickerOpen(
                                        open => !open
                                    )
                                }
                                className="cursor-pointer text-sm font-black text-slate-950 hover:text-slate-700"
                            >
                                {formatMonth(visibleMonth)}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setVisibleMonth(
                                        new Date(
                                            visibleMonth.getFullYear(),
                                            visibleMonth.getMonth() + 1,
                                            1
                                        )
                                    )
                                }
                                className="grid h-9 w-9 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {isMonthPickerOpen ? (
                            <div className="grid grid-cols-3 gap-2">
                                {monthNames.map((name, index) => {
                                    const isSelected =
                                        visibleMonth.getMonth() ===
                                        index;

                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() =>
                                                handleSelectMonth(
                                                    index
                                                )
                                            }
                                            className={`rounded-2xl px-3 py-2 text-sm font-bold transition ${
                                                isSelected
                                                    ? "bg-slate-950 text-white"
                                                    : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            {name}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <>
                                <div className="mb-1 grid grid-cols-7 text-center text-xs font-bold text-slate-400">
                                    {weekDays.map(day => (
                                        <span
                                            key={day}
                                            className="py-1"
                                        >
                                            {day}
                                        </span>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7">
                                    {buildCalendarDays(
                                        visibleMonth
                                    ).map((date, index) => {
                                        if (!date)
                                            return (
                                                <div
                                                    key={`empty-${index}`}
                                                />
                                            );

                                        const today = new Date();
                                        today.setHours(
                                            0,
                                            0,
                                            0,
                                            0
                                        );

                                        const isPast =
                                            date < today;
                                        const isDeparture =
                                            isSameDay(
                                                date,
                                                departureDate
                                            );
                                        const isReturn =
                                            isSameDay(
                                                date,
                                                returnDate
                                            );
                                        const isInRange =
                                            isBetweenDates(
                                                date,
                                                departureDate,
                                                returnDate
                                            );
                                        const isSelected =
                                            activeField ===
                                            "departure"
                                                ? isDeparture
                                                : isReturn ||
                                                  isDeparture;

                                        return (
                                            <button
                                                key={date.toISOString()}
                                                type="button"
                                                disabled={isPast}
                                                onClick={() =>
                                                    handleSelectDate(
                                                        date
                                                    )
                                                }
                                                className={`relative m-0.5 grid h-10 place-items-center rounded-xl text-sm font-bold transition ${
                                                    isSelected
                                                        ? "z-10 bg-slate-950 text-white"
                                                        : isInRange
                                                        ? "bg-slate-100 text-slate-700"
                                                        : isPast
                                                        ? "cursor-not-allowed text-slate-300"
                                                        : "text-slate-700 hover:bg-slate-50"
                                                }`}
                                            >
                                                {date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                            <span className="text-xs font-semibold text-slate-500">
                                {activeField === "departure"
                                    ? "Gidiş tarihi seçin"
                                    : "Dönüş tarihi seçin"}
                            </span>

                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-full bg-slate-950 px-5 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                            >
                                Kapat
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function LocationSelector({ label, value, options, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef(null);
    const selectedOption = options.find(option => option.value === value);

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = event => {
            if (
                selectorRef.current &&
                !selectorRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = event => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div ref={selectorRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(open => !open)}
                className="block min-h-20 w-full rounded-2xl bg-white/85 px-4 py-3 text-left"
            >
                <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                    {label}
                </span>

                <span
                    className={`mt-2 block text-lg font-black ${
                        value ? "text-slate-950" : "text-slate-400"
                    }`}
                >
                    {selectedOption?.label || "Şehir seç"}
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 8 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="absolute left-0 right-0 top-full z-30 max-h-72 overflow-y-auto rounded-3xl border border-white/80 bg-white p-2 shadow-2xl"
                    >
                        {options.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-black transition hover:bg-cyan-50 hover:text-cyan-700 ${
                                    value === option.value
                                        ? "bg-slate-950 text-white hover:bg-slate-950 hover:text-white"
                                        : "text-slate-700"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PassengerSelector({
    passengers,
    setPassengers,
    cabinClass,
    setCabinClass,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef(null);

    const totalPassengers =
        passengers.adults + passengers.children;

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = event => {
            if (
                selectorRef.current &&
                !selectorRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = event => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const updatePassengerCount = (type, change) => {
        setPassengers(currentPassengers => {
            const nextValue = Math.max(
                type === "adults" ? 1 : 0,
                currentPassengers[type] + change
            );

            return {
                ...currentPassengers,
                [type]: nextValue,
            };
        });
    };

    return (
        <div ref={selectorRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(open => !open)}
                className="flex min-h-20 w-full items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/85 px-4 text-left shadow-sm"
            >
                <span className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-800">
                        <UserRound size={21} />
                    </span>

                    <span>
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Yolcular
                        </span>

                        <span className="mt-1 block text-base font-black text-slate-950">
                            {totalPassengers} yolcu, {cabinClass}
                        </span>
                    </span>
                </span>

                <ChevronDown
                    size={18}
                    className={`text-slate-500 transition ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 8 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="absolute left-0 right-0 top-full z-20 rounded-[1.75rem] border border-white/80 bg-white p-4 shadow-2xl"
                    >
                        {[
                            ["adults", "Yetişkin", "12+ yaş"],
                            ["children", "Çocuk", "2-11 yaş"],
                        ].map(([type, title, subtitle]) => (
                            <div
                                key={type}
                                className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0"
                            >
                                <span>
                                    <span className="block text-sm font-black text-slate-950">
                                        {title}
                                    </span>

                                    <span className="text-xs font-semibold text-slate-500">
                                        {subtitle}
                                    </span>
                                </span>

                                <span className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            updatePassengerCount(
                                                type,
                                                -1
                                            )
                                        }
                                        className="grid h-9 w-9 place-items-center rounded-full bg-slate-100"
                                    >
                                        <Minus size={16} />
                                    </button>

                                    <span className="w-5 text-center text-sm font-black">
                                        {passengers[type]}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            updatePassengerCount(
                                                type,
                                                1
                                            )
                                        }
                                        className="grid h-9 w-9 place-items-center rounded-full bg-cyan-50 text-cyan-700"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </span>
                            </div>
                        ))}

                        <label className="mt-4 block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                Kabin sınıfı
                            </span>

                            <select
                                value={cabinClass}
                                onChange={event =>
                                    setCabinClass(event.target.value)
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold"
                            >
                                {cabinClasses.map(option => (
                                    <option key={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="mt-4 h-12 w-full rounded-2xl bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800"
                        >
                            Tamam
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();

    const [tripType, setTripType] =
        useState("Gidiş Dönüş");

    const [dateMode, setDateMode] =
        useState("specific");

    const [fromLocation, setFromLocation] =
        useState("");

    const [toLocation, setToLocation] =
        useState("");

    const [formError, setFormError] =
        useState("");

    const [locationOptions, setLocationOptions] =
        useState([]);

    const [departureDate, setDepartureDate] =
        useState(new Date(2026, 5, 12));

    const [returnDate, setReturnDate] =
        useState(new Date(2026, 5, 19));

    const [departureMonth, setDepartureMonth] =
        useState(new Date(2026, 5, 1));

    const [returnMonth, setReturnMonth] =
        useState(new Date(2026, 6, 1));

    const [passengers, setPassengers] = useState({
        adults: 1,
        children: 0,
    });

    const [cabinClass, setCabinClass] =
        useState("Ekonomi");

    useEffect(() => {
        async function fetchLocations() {
            try {
                const response = await fetch("https://vacation-planning-website-backend.onrender.com/api/locations");
                const data = await response.json();

                setLocationOptions(
                    data.map(item => ({
                        value: item.value,
                        label: item.label,
                    }))
                );
            } catch {
                setLocationOptions([]);
                setFormError("Sehir listesi backend'den alinamadi.");
            }
        }

        fetchLocations();
    }, []);

    const swapLocations = () => {
        setFromLocation(toLocation);
        setToLocation(fromLocation);
    };

    const handleSearch = event => {
        event.preventDefault();

        if (
            !locationOptions.some(option => option.value === fromLocation) ||
            !locationOptions.some(option => option.value === toLocation)
        ) {
            setFormError(
                "Lütfen listeden geçerli bir konum seçin."
            );
            return;
        }

        const totalPassengers =
            passengers.adults + passengers.children;

        const date =
            dateMode === "month"
                ? toMonthValue(departureMonth)
                : toDateValue(departureDate);

        const returnDateValue =
            tripType === "Tek Yön"
                ? ""
                : dateMode === "month"
                ? toMonthValue(returnMonth)
                : toDateValue(returnDate);

        localStorage.setItem(
            "tripInfo",
            JSON.stringify({
                from: fromLocation,
                to: toLocation,
                date,
                returnDate: returnDateValue,
                dateMode,
                passengers: totalPassengers,
                passengerBreakdown: passengers,
                cabinClass,
                tripType,
            })
        );

        navigate("/type", { replace: true });
    };

    return (
        <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
            <section
                className="relative flex min-h-screen items-center bg-cover bg-center px-4 py-32"
                style={{
                    backgroundImage: `url(${heroImage})`,
                }}
            >
                <div className="absolute inset-0 bg-slate-950/60" />

                <div className="relative z-10 mx-auto w-full max-w-7xl">
                    <div className="mb-10 max-w-2xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-xl">
                            <Plane size={16} />
                            Asistan
                        </div>

                        <h1 className="text-5xl font-black leading-tight sm:text-6xl">
                           Tatil planı yapmak artık çok daha kolay!
                        </h1>

                        <p className="mt-6 text-lg leading-8 text-white/80">
                            Rotanı seç, tarihleri kolayca
                            karşılaştır ve sana uygun tatili anında planla.
                        </p>
                    </div>

                    <motion.form
                        onSubmit={handleSearch}
                        className="rounded-4xl border border-white/30 bg-white/70 p-6 text-slate-950 backdrop-blur-2xl"
                    >
                        <div className="mb-5 flex flex-wrap gap-2">
                            {tripTypes.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        setTripType(type);

                                        if (
                                            type === "Tek Yön"
                                        ) {
                                            setReturnDate(null);
                                            setReturnMonth(null);
                                        }
                                    }}
                                    className={`rounded-full px-4 py-2 text-sm font-black transition ${
                                        tripType === type
                                            ? "bg-slate-950 text-white"
                                            : "bg-white text-slate-700"
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr]">
                            <LocationSelector
                                label="Nereden"
                                value={fromLocation}
                                options={locationOptions}
                                onChange={value => {
                                    setFromLocation(value);
                                    setFormError("");
                                }}
                            />

                            <button
                                type="button"
                                onClick={swapLocations}
                                aria-label="Konumları değiştir"
                                className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-cyan-700"
                            >
                                <Shuffle size={19} />
                            </button>

                            <LocationSelector
                                label="Nereye"
                                value={toLocation}
                                options={locationOptions}
                                onChange={value => {
                                    setToLocation(value);
                                    setFormError("");
                                }}
                            />
                        </div>

                        {formError && (
                            <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                                {formError}
                            </p>
                        )}

                        <div className="mt-3 grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
                            <DatePicker
                                tripType={tripType}
                                dateMode={dateMode}
                                setDateMode={setDateMode}
                                departureDate={departureDate}
                                returnDate={returnDate}
                                departureMonth={departureMonth}
                                returnMonth={returnMonth}
                                onSelectDeparture={
                                    setDepartureDate
                                }
                                onSelectReturn={
                                    setReturnDate
                                }
                                onSelectDepartureMonth={
                                    setDepartureMonth
                                }
                                onSelectReturnMonth={
                                    setReturnMonth
                                }
                            />

                            <PassengerSelector
                                passengers={passengers}
                                setPassengers={setPassengers}
                                cabinClass={cabinClass}
                                setCabinClass={
                                    setCabinClass
                                }
                            />
                        </div>

                        <motion.button
                            type="submit"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-cyan-500 via-blue-600 to-indigo-600 text-lg font-black text-white"
                        >
                            <Search size={22} />
                            Uçuş Ara
                            <ArrowRight size={20} />
                        </motion.button>
                    </motion.form>
                </div>
            </section>
        </main>
    );
}
