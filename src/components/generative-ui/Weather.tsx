import React from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Thermometer, Droplets, Wind } from 'lucide-react'

interface WeatherProps {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  forecast: Array<{
    time: string
    temp: number
    condition: string
  }>
}

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'Sunny':
      return <Sun className="w-6 h-6 text-yellow-500" />
    case 'Cloudy':
      return <Cloud className="w-6 h-6 text-gray-500" />
    case 'Rainy':
      return <CloudRain className="w-6 h-6 text-blue-500" />
    case 'Snowy':
      return <CloudSnow className="w-6 h-6 text-blue-300" />
    default:
      return <Sun className="w-6 h-6 text-yellow-500" />
  }
}

export const Weather: React.FC<WeatherProps> = ({
  location,
  temperature,
  condition,
  humidity,
  windSpeed,
  forecast
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Weather in {location}
        </h2>
        {getWeatherIcon(condition)}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Thermometer className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Temperature</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {temperature}°C
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Humidity</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {humidity}%
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Wind className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Wind Speed</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {windSpeed} km/h
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Weather
          </div>
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {condition}
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Today's Forecast
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {forecast.map((item, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {item.time}
              </div>
              <div className="my-1">
                {getWeatherIcon(item.condition)}
              </div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {item.temp}°C
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
