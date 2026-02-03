export function convertToBoolean(input: string): boolean | undefined {
  try {
    return JSON.parse(input.toLowerCase())
  } catch (e) {
    return undefined
  }
}

export function shortAddress(value: string | undefined): string {
  if (!value) {
    return ''
  }
  return `${value.slice(0, 5)}...${value.slice(-4)}`
}

export function firstAddress(value: string): string {
  return `${value.slice(0, 5)}`
}

export const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
  arr.reduce((groups, item) => {
    ;(groups[key(item)] ||= []).push(item)
    return groups
  }, {} as Record<K, T[]>)

export function calculatePercentageChange(oldValue: number, newValue: number): number {
  const change = newValue - oldValue
  const percentageChange = (change / oldValue) * 100
  return percentageChange
}

export function calculateDayPercentage(): number {
  const now = new Date()
  const startOfDay = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const millisecondsInDay = 24 * 60 * 60 * 1000

  return ((now.getTime() - startOfDay.getTime()) / millisecondsInDay) * 100
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true
  }

  if (Array.isArray(value) && value.length === 0) {
    return true
  }

  return false
}
