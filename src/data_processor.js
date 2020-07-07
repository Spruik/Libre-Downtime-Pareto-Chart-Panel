import moment from 'moment'

/**
 * Expecting columns names, and rows values
 * Return {col-1 : value-1, col-2 : value-2 .....}
 * @param {*} rowCols
 * @param {*} rows
 */
export function restructuredData (rowCols, rows) {
  const data = []
  const cols = rowCols.reduce((arr, c) => {
    const col = c.text.toLowerCase()
    arr.push(col)
    return arr
  }, [])
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const serise = {}
    for (let k = 0; k < cols.length; k++) {
      const col = cols[k]
      serise[col] = row[k]
    }
    data.push(serise)
  }

  return data
}

/**
 * Expecting the restructured datalist
 * Return an array with distinct categories  --> ['category-1', 'category-2', ...]
 * @param {*} data
 */
export function getCategories (data) {
  const categories = data.reduce((arr, d) => {
    if (d.category !== null && d.category !== undefined) {
      arr.push(d.category)
    }
    return arr
  }, [])

  return Array.from(new Set(categories))
}

/**
 * Expecting categories-legends and the restructured datalist
 * For each legend, filter this legends data from the datalist, and then return an array of obj in this format
 * [{value: categoryData.length, type: 'Category', name: category}, .....]
 *
 * Note: The first item will be set to be selected = true
 *
 * @param {*} categories
 * @param {*} data
 */
export function getCategoriesData (categories, data) {
  const categoriesData = []

  let sum = 0.00
  let durSum = 0.00
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i]
    const categoryData = data.filter(d => d.category === category)

    let duration = 0.00
    for (let i = 0; i < categoryData.length; i++) {
      const c = categoryData[i]
      if (c.durationint) {
        duration += c.durationint
      }
    }

    const hours = moment.duration(duration).asHours()
    let fixedHours = hours
    if (hasDecimal(hours)) {
      fixedHours = parseFloat(hours.toFixed(2))
    }

    const item = { value: categoryData.length, type: 'Category', name: category, duration: fixedHours, isDurationMode: false }
    sum += item.value
    durSum += hours

    categoriesData.push(item)
  }

  if (hasDecimal(durSum)) {
    durSum = parseFloat(durSum.toFixed(2))
  }

  for (let i = 0; i < categoriesData.length; i++) {
    let percent = (categoriesData[i].value / sum * 100)
    if (hasDecimal(percent)) {
      percent = parseFloat(percent.toFixed(2))
    }
    const durPercent = (categoriesData[i].duration / durSum * 100)

    categoriesData[i].p = percent
    categoriesData[i].durP = durPercent
    categoriesData[i].total = sum
    categoriesData[i].durationTotal = durSum
  }

  return categoriesData
}

export function sortMax (data, key) {
  return key === 'value' ? data.sort((a, b) => b.value - a.value) : data.sort((a, b) => b.duration - a.duration)
}

export function filterItems (data, key) {
  return data.reduce((arr, d) => {
    if (key === 'name') {
      arr.push(d.name)
    } else if (key === 'value') {
      arr.push(d.value)
    } else if (key === 'percent') {
      arr.push(d.p)
    } else if (key === 'duration') {
      arr.push(d.duration)
    } else if (key === 'dur-p') {
      arr.push(d.durP)
    }
    return arr
  }, [])
}

export function accumulatePercentages (arr) {
  let temp = 0.00
  for (let i = 0; i < arr.length; i++) {
    temp += arr[i]

    if (hasDecimal(temp)) { temp = parseFloat(temp.toFixed(2)) }

    if (i === arr.length - 1) {
      // set the last item to 100
      arr[i] = 100
    } else {
      arr[i] = temp
    }
  }
  return arr
}

export function getReasonsData (category, data) {
  const reasonsData = []

  const items = takeItems(category, data)

  let sum = 0.00
  let durSum = 0.00
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const reasonData = data.filter(d => d.category === category && d.parentreason === item)

    let duration = 0.00
    for (let i = 0; i < reasonData.length; i++) {
      const r = reasonData[i]
      if (r.durationint) {
        duration += r.durationint
      }
    }

    const hours = moment.duration(duration).asHours()
    let fixedHours = hours
    if (hasDecimal(hours)) {
      fixedHours = parseFloat(hours.toFixed(2))
    }

    const reason = { value: reasonData.length, type: 'Reason', name: item, duration: fixedHours, isDurationMode: false }
    sum += reason.value
    durSum += hours

    reasonsData.push(reason)
  }

  if (hasDecimal(durSum)) {
    durSum = parseFloat(durSum.toFixed(2))
  }

  for (let i = 0; i < reasonsData.length; i++) {
    let percent = (reasonsData[i].value / sum * 100)

    if (hasDecimal(percent)) {
      percent = parseFloat(percent.toFixed(2))
    }

    const durPercent = (reasonsData[i].duration / durSum * 100)

    reasonsData[i].durP = durPercent
    reasonsData[i].p = percent
    reasonsData[i].durationTotal = durSum
  }

  return reasonsData
}

// look for the distinct items that this category has
function takeItems (category, data) {
  return Array.from(new Set(data.reduce((arr, d) => {
    if (d.reason !== null && d.reason !== undefined) {
      // because the reasons in the influxdb is stored like 'root reason | sub reason'
      // reasons.length === 1 meaning that there is no sub reasons for this item
      // because this chart only display categories and reasons up to reason level - 1
      if (d.category === category && d.parentreason !== null && d.parentreason !== undefined) {
        arr.push(d.parentreason)
      }
    }
    return arr
  }, [])))
}

function hasDecimal (n) {
  return (n - Math.floor(n)) !== 0
}
