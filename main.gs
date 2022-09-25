//==============================================
//======================定数====================
//==============================================

//SlackAPIの投稿用のトークンを設定する
const slackToken = PropertiesService.getScriptProperties().getProperty('SLACK_BOT_TOKEN')
//ライブラリから導入したSlackAppを定義し、トークンを設定する
const slackApp = SlackApp.create(slackToken)
//Slackボットがメッセージを投稿するチャンネル(randomを設定)を定義する(個人IDを指定すればDMも可)
const channelId = "#it-team-test"
//実行ユーザーのデフォルトであるGoogleカレンダーを取得する
const myCalendar = CalendarApp.getCalendarsByName('000_カレッジイベント')[0]
//曜日取得用
const weekItems = ["日", "月", "火", "水", "木", "金", "土"]

//==============================================
//==============================================

const currentDate = new Date()

// copy python's range function
function* range(_start_, _end_) {
  for (let h = _start_;h <= _end_;h++) {
    yield h
  }
}

const getEventsCount = (arr) => {
  const length = arr.reduce((prev, cur) => {
    const ressult = prev += cur.length
    return ressult
  }, 0)
  return length
}

const getOneDayMsg = (oneDayEvents) => {
  const month = currentDate.getMonth() + 1
  const date = currentDate.getDate()
  const dayIndex = currentDate.getDay()
  const dayOfWeek = weekItems[dayIndex]
  let oneDayMsgHeader = `=======*[${month}/${date} (${dayOfWeek})]*=======\n`
  let oneDayMsgContent = ''
  if (oneDayEvents.length) {
    oneDayEvents.map(event => {
      const startH = event.getStartTime().getHours()
      let startM = event.getStartTime().getMinutes()

      if (startM < 10) startM = "0" + startM
      const endH = event.getEndTime().getHours()
      let endM = event.getEndTime().getMinutes()
      if (endM < 10) endM = "0" + endM

      const location = event.getLocation()
      const locationInfo = location && `\n> @ ${location}`
      oneDayMsgContent += `> *${event.getTitle()}* \n> ${month}/${date} (${dayOfWeek}) ${startH} : ${startM} ~ ${endH} : ${endM} ${locationInfo} \n`
    })
  } else {
    oneDayMsgContent += "No Event!\n"
  }
  currentDate.setDate(date + 1)
  return oneDayMsgHeader + oneDayMsgContent + '\n'
}

function main() {
  const filteredWeekEventArr = []

  for (h of range(0, 6)) {
    //Googleカレンダーの予定取得する日(今日)を設定する
    const calDate = new Date()
    calDate.setDate(new Date().getDate() + h)
    const allEvents = myCalendar.getEventsForDay(calDate)
    if (allEvents.length) {
      const filteredTodayEvents = allEvents.filter(event => !event.isAllDayEvent())
      filteredWeekEventArr.push(filteredTodayEvents)
    } else {
      filteredWeekEventArr.push([])
    }
  }
  if (!filteredWeekEventArr.length) return slackApp.postMessage(channelId, `There is no event this week!`)

  const eventsCount = getEventsCount(filteredWeekEventArr)
  const oneWeekMsgHeader = `*[There ${eventsCount > 1 ? `are ${eventsCount} events` : `is *${eventsCount}* event`} next week!]* \n\n`

  const msgArr = filteredWeekEventArr.map(oneDayEvents => getOneDayMsg(oneDayEvents))

  const oneWeekMsgContent = msgArr.join('')

  const totalMsg = oneWeekMsgHeader + oneWeekMsgContent + '\n良い一週間を！'

  //SlackAppオブジェクトのpostMessageメソッドでボット投稿を行う
  slackApp.postMessage(channelId, totalMsg)
}