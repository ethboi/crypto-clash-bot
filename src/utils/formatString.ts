export const truncateAddress = (address: string, first = 5, last = 5) =>
  `${address.slice(0, first)}...${address.slice(-last, address.length)}`

export const truncateString = (text: string, max = 256) => {
  if (text?.length > max) return text.substring(0, max) + ' ...'
  return text
}

export const strPadLeft = (string: string | number, pad: string, length: number) => {
  return (new Array(length + 1).join(pad) + string).slice(-length)
}

export function hexToAscii(hex: string): string {
  try {
    if (!hex || typeof hex !== 'string') return ''
    let str = ''
    for (let i = 2; i < hex.length; i += 2) {
      const charCode = parseInt(hex.substr(i, 2), 16)
      if (charCode) {
        str += String.fromCharCode(charCode)
      }
    }
    return str
  } catch (error) {
    console.error('Error in hexToAscii:', error, hex)
    return ''
  }
}

export const hexToAsciiV2 = (S: string) => {
  // https://gist.github.com/gluk64/fdea559472d957f1138ed93bcbc6f78a#file-reason-js
  const hex = S.substr(147).toString()
  let str = ''
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16))
  }
  return str
}

export function titleCaseWord(word: string) {
  if (!word) {
    return word
  }
  return word[0].toUpperCase() + word.slice(1).toLowerCase()
}
