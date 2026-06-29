export const getYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let y = 2020; y <= currentYear + 2; y++) {
    years.push(y)
  }
  return years
}