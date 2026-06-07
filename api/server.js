import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const databasePath = join(__dirname, "../data/trips.json");
const port = Number(process.env.PORT) || 3000;
const host = "0.0.0.0";

const sendJson = (response, statusCode, data) => {
    response.writeHead(statusCode, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    });
    response.end(JSON.stringify(data));
};

const logError = (label, error) => {
    console.error(`[${label}]`, error?.stack || error);
};

const readTrips = async () => {
    try {
        const file = await readFile(databasePath, "utf8");
        return JSON.parse(file);
    } catch (error) {
        if (error.code === "ENOENT") {
            await mkdir(dirname(databasePath), { recursive: true });
            await writeFile(databasePath, "[]");
            return [];
        }

        throw error;
    }
};

const saveTrips = async trips => {
    await mkdir(dirname(databasePath), { recursive: true });
    await writeFile(databasePath, JSON.stringify(trips, null, 2));
};

const parseBody = request => new Promise((resolve, reject) => {
    let body = "";

    request.on("data", chunk => {
        body += chunk;
    });

    request.on("end", () => {
        try {
            resolve(body ? JSON.parse(body) : {});
        } catch (error) {
            reject(error);
        }
    });

    request.on("error", reject);
});

const validateTrip = trip => {
    if (!trip.from || !trip.to || !trip.passengers) {
        return "Tum alanlar doldurulmali.";
    }

    if (trip.dateType === "range") {
        if (!trip.startDate || !trip.endDate) {
            return "Tarih araligi icin baslangic ve bitis tarihi secilmeli.";
        }

        if (new Date(trip.startDate) > new Date(trip.endDate)) {
            return "Baslangic tarihi bitis tarihinden sonra olamaz.";
        }

        if (trip.isFlexible && Number(trip.flexibleDays) < 1) {
            return "Esnek gun sayisi en az 1 olmali.";
        }
    } else if (!trip.date) {
        return "Tarih secilmeli.";
    }

    if (Number(trip.passengers) < 1) {
        return "Kisi sayisi en az 1 olmali.";
    }

    return null;
};

const normalizeText = value => String(value || "").trim();

const categorySettings = {
    cheap: {
        label: "Butce dostu",
        multiplier: 0.82,
        airlines: ["Pegasus", "AnadoluJet", "SunExpress"],
        hotel: "Ekonomik otel",
    },
    budget: {
        label: "Butce dostu",
        multiplier: 0.82,
        airlines: ["Pegasus", "AnadoluJet", "SunExpress"],
        hotel: "Ekonomik otel",
    },
    mid: {
        label: "Fiyat/konfor dengesi",
        multiplier: 1.08,
        airlines: ["Turkish Airlines", "AJet", "Lufthansa"],
        hotel: "Merkezi otel",
    },
    medium: {
        label: "Fiyat/konfor dengesi",
        multiplier: 1.08,
        airlines: ["Turkish Airlines", "AJet", "Lufthansa"],
        hotel: "Merkezi otel",
    },
    comfort: {
        label: "Rahat yolculuk",
        multiplier: 1.46,
        airlines: ["Turkish Airlines", "Qatar Airways", "Emirates"],
        hotel: "Premium otel",
    },
};

const validateSearch = search => {
    if (!normalizeText(search.from_location || search.from || search.origin) || !normalizeText(search.to || search.to_location || search.destination) || !normalizeText(search.date || search.departureDate || search.departure_date || search.startDate || search.start_date)) {
        return "Kalkis, varis ve tarih alanlari zorunlu.";
    }

    if (Number(search.passengers || search.passengerCount || search.passenger_count || search.peopleCount) < 1) {
        return "Yolcu sayisi en az 1 olmali.";
    }

    if (!categorySettings[search.category || search.type || search.preference || search.travelType || search.travel_type || search.budgetType]) {
        return "Gecersiz kategori.";
    }

    return null;
};

const hashText = value => normalizeText(value)
    .toLowerCase()
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);

const getDateDemand = dateValue => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return 1;
    }

    const monthDemand = [0.94, 0.98, 1.04, 1.08, 1.12, 1.28, 1.34, 1.3, 1.14, 1.02, 0.96, 1.18];
    const weekendDemand = [0, 5, 6].includes(date.getDay()) ? 1.13 : 1;

    return monthDemand[date.getMonth()] * weekendDemand;
};

const roundToTen = value => Math.max(690, Math.round(value / 10) * 10);

const buildSearchPackages = search => {
    const category = search.category || search.type || search.preference || search.travelType || search.travel_type || search.budgetType;
    const from = normalizeText(search.from_location || search.from || search.origin);
    const to = normalizeText(search.to || search.to_location || search.destination);
    const date = normalizeText(search.date || search.departureDate || search.departure_date || search.startDate || search.start_date);
    const passengers = Number(search.passengers || search.passengerCount || search.passenger_count || search.peopleCount) || 1;
    const settings = categorySettings[category];
    const routeHash = hashText(`${from}-${to}`);
    const routeDemand = 0.86 + (routeHash % 41) / 100;
    const distanceProxy = 820 + Math.abs(hashText(from) - hashText(to)) * 7;
    const dateDemand = getDateDemand(date);

    return settings.airlines.map((airline, index) => {
        const optionDemand = 0.92 + ((routeHash + index * 17) % 29) / 100;
        const price = roundToTen(distanceProxy * settings.multiplier * dateDemand * routeDemand * optionDemand * passengers);
        const stops = index === 0 ? "Direkt ucus" : `${index} aktarma`;

        return {
            id: `${category}-${routeHash}-${index + 1}`,
            title: `${airline} ${stops.toLowerCase()}`,
            route: `${from} - ${to}`,
            airline,
            description: `${stops}, ${settings.hotel}, ${passengers} yolcu icin toplam ${price.toLocaleString("tr-TR")} TL.`,
            summary: `${settings.label}: ${airline} ile ${from} - ${to} rotasi.`,
            date,
            passengers,
            price,
            currency: "TRY",
            category,
        };
    });
};

const handleRecommendRequest = async (request, response) => {
    const payload = await parseBody(request);

    if (payload.travelType && typeof payload.wantsCarRental === "boolean") {
        const updatedTrip = await saveLatestTripOptions(payload);

        if (!updatedTrip) {
            return sendJson(response, 404, { message: "Kaydedilecek yolculuk bulunamadi." });
        }

        return sendJson(response, 200, updatedTrip);
    }

    const errorMessage = validateSearch(payload);

    if (errorMessage) {
        return sendJson(response, 400, { message: errorMessage });
    }

    return sendJson(response, 200, {
        packages: buildSearchPackages(payload),
    });
};

const saveLatestTripOptions = async options => {
    const trips = await readTrips();
    const latestTrip = trips.at(-1);

    if (!latestTrip) {
        return null;
    }

    latestTrip.travelType = options.travelType;
    latestTrip.wantsCarRental = options.wantsCarRental;
    latestTrip.updatedAt = new Date().toISOString();
    await saveTrips(trips);

    return latestTrip;
};

const handleRequest = async (request, response) => {
    console.log(`${request.method} ${request.url}`);

    if (request.method === "OPTIONS") {
        return sendJson(response, 200, {});
    }

    if (request.url === "/health" && request.method === "GET") {
        return sendJson(response, 200, {
            ok: true,
            service: "travel-assistant-api",
            time: new Date().toISOString(),
        });
    }

    if (request.url === "/api/trips" && request.method === "GET") {
        try {
            const trips = await readTrips();
            return sendJson(response, 200, trips);
        } catch (error) {
            logError("GET /api/trips", error);
            return sendJson(response, 500, { message: "Yolculuklar okunamadi." });
        }
    }

    if (request.url === "/api/trips" && request.method === "POST") {
        try {
            const trip = await parseBody(request);
            const errorMessage = validateTrip(trip);

            if (errorMessage) {
                return sendJson(response, 400, { message: errorMessage });
            }

            const trips = await readTrips();
            const newTrip = {
                id: randomUUID(),
                from: trip.from,
                to: trip.to,
                dateType: trip.dateType || "range",
                date: trip.date,
                startDate: trip.dateType === "range" ? trip.startDate : "",
                endDate: trip.dateType === "range" ? trip.endDate : "",
                isFlexible: Boolean(trip.isFlexible),
                flexibleDays: trip.isFlexible ? Number(trip.flexibleDays) : null,
                passengers: Number(trip.passengers),
                createdAt: new Date().toISOString(),
            };

            trips.push(newTrip);
            await saveTrips(trips);

            return sendJson(response, 201, newTrip);
        } catch (error) {
            logError("POST /api/trips", error);
            return sendJson(response, 400, { message: "Gecersiz istek." });
        }
    }

    if (request.url === "/api/trips/latest/options" && request.method === "POST") {
        try {
            const options = await parseBody(request);

            if (!options.travelType || typeof options.wantsCarRental !== "boolean") {
                return sendJson(response, 400, { message: "Secim bilgileri eksik." });
            }

            const updatedTrip = await saveLatestTripOptions(options);

            if (!updatedTrip) {
                return sendJson(response, 404, { message: "Kaydedilecek yolculuk bulunamadi." });
            }

            return sendJson(response, 200, updatedTrip);
        } catch (error) {
            logError("POST /api/trips/latest/options", error);
            return sendJson(response, 400, { message: "Gecersiz istek." });
        }
    }

    if (request.url === "/api/trips/recommend" && request.method === "POST") {
        try {
            return await handleRecommendRequest(request, response);
        } catch (error) {
            logError("POST /api/trips/recommend", error);
            return sendJson(response, 500, { message: "Oneri istegi sirasinda backend hatasi olustu." });
        }
    }

    if (request.url === "/search" && request.method === "POST") {
        try {
            return await handleRecommendRequest(request, response);
        } catch (error) {
            logError("POST /search", error);
            return sendJson(response, 500, { message: "Arama sirasinda backend hatasi olustu." });
        }
    }

    return sendJson(response, 404, { message: "Endpoint bulunamadi." });
};

const server = createServer(async (request, response) => {
    try {
        await handleRequest(request, response);
    } catch (error) {
        logError("Unhandled request error", error);

        if (!response.headersSent) {
            sendJson(response, 500, { message: "Beklenmeyen backend hatasi." });
        } else {
            response.end();
        }
    }
});

server.listen(port, host, () => {
    const publicUrl = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : `http://localhost:${port}`;

    console.log(`API ${publicUrl} adresinde calisiyor`);
});
