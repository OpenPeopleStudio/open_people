/**
 * Delivery Route Optimization
 * 
 * Uses a simple greedy nearest-neighbor algorithm for route optimization.
 * For production, consider using OR-Tools, GraphHopper, or similar libraries.
 */

export interface Location {
  lat: number
  lng: number
  address?: string
  name?: string
}

export interface DeliveryStop {
  order_id: string
  location: Location
  priority?: number
  time_window?: {
    start: string
    end: string
  }
}

export interface OptimizedRoute {
  stops: DeliveryStop[]
  total_distance_km: number
  estimated_duration_minutes: number
  start_location: Location
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(loc2.lat - loc1.lat)
  const dLon = toRadians(loc2.lng - loc1.lng)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(loc1.lat)) *
      Math.cos(toRadians(loc2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Optimize route using nearest neighbor algorithm
 */
export function optimizeRoute(
  startLocation: Location,
  stops: DeliveryStop[]
): OptimizedRoute {
  if (stops.length === 0) {
    return {
      stops: [],
      total_distance_km: 0,
      estimated_duration_minutes: 0,
      start_location: startLocation,
    }
  }

  const unvisited = [...stops]
  const route: DeliveryStop[] = []
  let currentLocation = startLocation
  let totalDistance = 0

  // Greedy nearest neighbor approach
  while (unvisited.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Infinity

    // Find nearest unvisited stop
    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(currentLocation, unvisited[i].location)
      
      // Consider priority (lower distance for higher priority)
      const adjustedDistance = distance / (unvisited[i].priority || 1)
      
      if (adjustedDistance < nearestDistance) {
        nearestDistance = adjustedDistance
        nearestIndex = i
      }
    }

    // Add nearest stop to route
    const nextStop = unvisited[nearestIndex]
    const actualDistance = calculateDistance(currentLocation, nextStop.location)
    totalDistance += actualDistance
    route.push(nextStop)
    currentLocation = nextStop.location
    unvisited.splice(nearestIndex, 1)
  }

  // Estimate duration (assuming 40 km/h average speed + 10 min per stop)
  const drivingMinutes = (totalDistance / 40) * 60
  const stopTime = route.length * 10
  const estimatedDuration = Math.round(drivingMinutes + stopTime)

  return {
    stops: route,
    total_distance_km: Math.round(totalDistance * 10) / 10,
    estimated_duration_minutes: estimatedDuration,
    start_location: startLocation,
  }
}

/**
 * Get center point of multiple locations (for clustering)
 */
export function getCenterPoint(locations: Location[]): Location {
  if (locations.length === 0) {
    throw new Error('No locations provided')
  }

  if (locations.length === 1) {
    return locations[0]
  }

  let sumLat = 0
  let sumLng = 0

  for (const loc of locations) {
    sumLat += loc.lat
    sumLng += loc.lng
  }

  return {
    lat: sumLat / locations.length,
    lng: sumLng / locations.length,
  }
}

/**
 * Cluster stops into groups (for multiple delivery staff)
 */
export function clusterStops(
  stops: DeliveryStop[],
  numClusters: number
): DeliveryStop[][] {
  if (stops.length <= numClusters) {
    return stops.map(stop => [stop])
  }

  // Simple k-means clustering
  const clusters: DeliveryStop[][] = Array.from({ length: numClusters }, () => [])
  
  // Initialize cluster centers randomly
  const centers: Location[] = []
  for (let i = 0; i < numClusters; i++) {
    const index = Math.floor((i / numClusters) * stops.length)
    centers.push(stops[index].location)
  }

  // Assign stops to nearest cluster
  for (const stop of stops) {
    let nearestCluster = 0
    let nearestDistance = Infinity

    for (let i = 0; i < centers.length; i++) {
      const distance = calculateDistance(stop.location, centers[i])
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestCluster = i
      }
    }

    clusters[nearestCluster].push(stop)
  }

  // Remove empty clusters
  return clusters.filter(cluster => cluster.length > 0)
}

/**
 * Calculate ETA for each stop in a route
 */
export function calculateETAs(
  route: OptimizedRoute,
  startTime: Date = new Date()
): Array<{ order_id: string; eta: Date }> {
  const etas: Array<{ order_id: string; eta: Date }> = []
  let currentTime = new Date(startTime)
  let currentLocation = route.start_location

  for (const stop of route.stops) {
    // Calculate travel time to this stop
    const distance = calculateDistance(currentLocation, stop.location)
    const travelMinutes = (distance / 40) * 60 // 40 km/h average

    // Add travel time and stop time
    currentTime = new Date(currentTime.getTime() + (travelMinutes + 10) * 60 * 1000)
    
    etas.push({
      order_id: stop.order_id,
      eta: currentTime,
    })

    currentLocation = stop.location
  }

  return etas
}
