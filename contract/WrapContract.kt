// Wrap API contract v1 for the Android app (kotlinx.serialization).
// Mirrors contract/openapi.yaml and src/contract.ts.
//
// Request:  POST /api/v1/wrap   {"userId": 42}   (rb_user_id)
// Response: WrapResponse. Render pages in order by `type`; skip unknown types.
//
// `data` is kept as a JsonObject and decoded per type, so a new page type added
// on the server never breaks an older app build.

package com.redbus.wrap.contract

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement

@Serializable data class WrapRequest(val userId: Long)

@Serializable data class WrapResponse(
    val schemaVersion: String,
    val wrapId: String,
    val userId: Long,
    val year: Int,
    val generatedAt: String,
    val locale: String,
    val currency: String,
    val user: WrapUser,
    val pages: List<WrapPage>,
    val share: ShareCard,
)

@Serializable data class WrapUser(val firstName: String? = null, val memberSince: Int)
@Serializable data class Copy(val kicker: String, val headline: String, val body: String? = null, val bubble: String? = null)
@Serializable data class Stat(val label: String, val value: String)
@Serializable data class City(val code: String, val name: String, val lat: Double, val lon: Double)
@Serializable data class ShareCard(val personaTitle: String, val stats: List<Stat>)
@Serializable data class ApiError(val error: ErrorBody) { @Serializable data class ErrorBody(val code: String, val message: String) }

@Serializable data class WrapPage(
    val id: String,
    val type: String,
    /** Reading time; start it only after the page's Rive animation reports it has finished. */
    val dwellMs: Long,
    val copy: Copy,
    val data: JsonObject,
    /** 1.1: per-user look. Render `layout` if this build has it, else the type's default. */
    val variant: Variant? = null,
)

@Serializable data class Variant(val layout: String, val palette: String? = null, val mascotMood: String? = null)

// ---- Page payloads ----
@Serializable data class IntroData(val year: Int, val totalTrips: Int)
@Serializable data class FirstStepsData(val trips: Int, val from: String, val to: String, val date: String)
@Serializable data class Leg(val from: String, val to: String, val mode: String, val count: Int)
@Serializable data class Equivalent(val label: String, val times: Double)
@Serializable data class OdometerData(val totalKm: Int, val busTrips: Int, val trainTrips: Int, val cities: List<City>, val legs: List<Leg>, val equivalent: Equivalent)
@Serializable data class PeakMonthData(val monthly: List<Int>, val peakMonthIndex: Int, val peakTrips: Int, val longestGapDays: Int)
@Serializable data class TopRouteData(val from: String, val to: String, val count: Int, val topPercentOnRoute: Double? = null, val rankOnRoute: Int? = null)
@Serializable data class NightOwlData(val nights: Int, val nightSharePct: Int, val sunrises: Int? = null, val usualDeparture: String)
@Serializable data class EarlyBirdData(val morningSharePct: Int, val earliestDeparture: String, val trips: Int)
@Serializable data class SeatData(val seatLabel: String, val count: Int, val windowPct: Int, val berth: String)
@Serializable data class RailData(val trips: Int, val km: Int, val longestHours: Double, val topClass: String)
@Serializable data class WaitlistData(val confirmed: Int, val path: List<String>, val pnrChecks: Int)
@Serializable data class LastMinuteData(val minLeadMinutes: Int, val avgLeadHours: Double)
@Serializable data class PlannerData(val avgLeadDays: Int, val earliestDays: Int? = null)
@Serializable data class FlexiData(val dateChanges: Int, val freeCancellations: Int, val feesSaved: Int, val from: String, val to: String, val dates: List<String>)
@Serializable data class Stop(val name: String, val time: String)
@Serializable data class LiveTrackingData(val checks: Int, val shares: Int, val onTimePct: Int, val from: String, val to: String, val stops: List<Stop>)
@Serializable data class HomewardData(val tripsHome: Int, val hometown: String, val festivals: List<String>, val avgLeadDays: Int)
@Serializable data class HotelData(val stays: Int, val nights: Int, val cities: List<String>, val topCity: String, val comboTrips: Int, val longestStayNights: Int)
@Serializable data class ExplorerData(val newCities: List<String>, val states: Int)
@Serializable data class SquadData(val groupBookings: Int, val largestGroup: Int, val seatsBooked: Int)
@Serializable data class SavingsData(val saved: Int, val chais: Int, val bestDeal: Int, val coupons: Int? = null)
@Serializable data class PrimoData(val rides: Int, val avgRatingGiven: Double)
@Serializable data class EcoData(val co2Kg: Int, val trees: Int)
@Serializable data class DreamData(val destination: String, val searches: Int)
@Serializable data class PersonaData(val personaId: String, val title: String, val traits: List<String>)
@Serializable data class Prediction(val destination: String, val by: String)
@Serializable data class SummaryData(val stats: List<Stat>, val prediction: Prediction? = null)
@Serializable data class Hero(val value: Double, val prefix: String? = null, val suffix: String? = null, val label: String? = null, val decimals: Int? = null)
@Serializable data class RouteEnds(val from: String, val to: String)
/** STREAK, RHYTHM, OPERATOR, GROWTH, EXTREMES, PLACES, SIGNATURE, FIRST_AND_LAST (1.1). */
/** TRAIN (proposed data). variant.layout: coaches | pnr | berth. */
@Serializable data class TrainData(val trips: Int, val km: Int, val from: String, val to: String, val topClass: String, val favBerth: String,
    val nightTrains: Int, val longestHours: Double, val waitlistConfirmed: Int, val wlPath: List<String>? = null)
@Serializable data class StayCity(val name: String, val nights: Int)
/** HOTEL_STAY (proposed data). variant.layout: keycard | skyline | luggage. */
@Serializable data class HotelStayData(val stays: Int, val nights: Int, val cities: List<StayCity>, val topCity: String, val longestStayNights: Int, val comboTrips: Int)
/** Also sent as `data.insight` on a classic page whose variant.layout isn't "default". */
@Serializable data class InsightData(
    val hero: Hero? = null, val facts: List<Stat>, val heatmap: List<Int>? = null, val weeks: List<Int>? = null, val quote: String? = null,
    val compare: List<Stat>? = null, val route: RouteEnds? = null, val stamps: List<String>? = null,
)

/** Typed page, or null for a type this build doesn't know (skip it). */
sealed interface TypedPage {
    data class Intro(val page: WrapPage, val data: IntroData) : TypedPage
    data class Odometer(val page: WrapPage, val data: OdometerData) : TypedPage
    data class Generic(val page: WrapPage) : TypedPage // extend with one subclass per type
}

fun WrapPage.typed(json: Json = Json { ignoreUnknownKeys = true }): TypedPage? = when (type) {
    "INTRO" -> TypedPage.Intro(this, json.decodeFromJsonElement(data))
    "ODOMETER" -> TypedPage.Odometer(this, json.decodeFromJsonElement(data))
    in KNOWN_TYPES -> TypedPage.Generic(this)
    else -> null
}

val KNOWN_TYPES = setOf(
    "INTRO", "FIRST_STEPS", "ODOMETER", "PEAK_MONTH", "TOP_ROUTE", "NIGHT_OWL", "EARLY_BIRD", "SEAT", "RAIL",
    "WAITLIST", "LAST_MINUTE", "PLANNER", "FLEXI", "LIVE_TRACKING", "HOMEWARD", "HOTEL", "EXPLORER", "SQUAD", "SAVINGS",
    "PRIMO", "ECO", "DREAM", "PERSONA", "SUMMARY",
    "STREAK", "RHYTHM", "OPERATOR", "GROWTH", "EXTREMES", "PLACES", "SIGNATURE", "FIRST_AND_LAST",
    "TRAIN", "HOTEL_STAY",
)
