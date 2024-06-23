import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import { v4 as uuid } from 'uuid'

const lilStyle = {
  marginLeft: '-0.25em',
  marginTop: '0.45em',
  width: '25px',
  height: '25px',
  borderRadius: '25px',
  zIndex: '10'
}

const BASE_URL = 'https://neorxna.github.io/frogquiz/'

const HiddenItem = props => {
  const { children, a: answer, c, answeredCheck, id, hinted } = props
  const answered = answeredCheck(id)
  return (
    <>
      {/* inline absolute element to represent comma rules e.g. <,|.> */}
      <div
        style={{
          position: 'absolute',
          display: 'inline',
          opacity: answered ? '0.5' : '0',
          //  border: answered ? '1px solid black' : 'none',
          background: 'rgb(93, 196, 14)',
          ...(children ? {} : lilStyle)
        }}
        onClick={e => {
          if (!children) c(id)
          if (answered) {
            e.stopPropagation()
          }
        }}
      ></div>
      {/* span to represent regular text rules e.g. <hillo|hello> */}
      <span
        label={id}
        style={
          children
            ? {
                //  border: answered ? '1px solid black' : 'none',
                opacity: hinted ? '0.3' : '1',
                background: answered ? 'rgb(93, 196, 14, 0.5)' : 'transparent',
                borderRadius: '10px',
                padding: answered ? '0.1em' : '0px'
              }
            : {}
        }
        onClick={e => {
          if (children) c(id)
          if (answered) {
            /* already clicked, so prevent another click from counting as an attempt */
            e.stopPropagation()
          }
        }}
      >
        {answered ? <b>{`${answer}`}</b> : children || ''}
      </span>
    </>
  )
}

const buildGame = source => (callback, answeredCheck, showHint) => {
  /* "Frogs are widely distributed<, r|. R>anging from the tropics to subarctic..." */
  // split on either < or >
  const separator = '|'

  const items = source.split(/<|>/g).map((item, index) => ({
    content: item,
    type: item.includes(separator) ? 'hidden' : 'text',
    id: index
  }))

  /* calculate runs of corrected hidden elements from the beginning of the text */
  const itemsHints = items.map((item, itemIndex) => {
    const allAnsweredUpToHere =
      item.type === 'hidden' &&
      answeredCheck(item.id) &&
      items.filter(
        o => o.type === 'hidden' && o.id < item.id && answeredCheck(o.id)
      ).length ===
        items.filter(o => o.type === 'hidden' && o.id < item.id).length
    return {
      ...item,
      allAnsweredUpToHere
    }
  })

  /* for the hint, find the element that is furtherest in the largest run */
  const greatestAllAnswered = itemsHints.reduce((prev, current) => {
    return current.allAnsweredUpToHere && current.id > prev.id ? current : prev
  })

  const itemRenders = items.map(item => {
    const hinted =
      showHint && greatestAllAnswered.id && item.id < greatestAllAnswered.id
    if (item.type === 'hidden') {
      const [show, answer] = item.content.split('|')
      return {
        ...item,
        component: (
          <HiddenItem
            hinted={hinted}
            id={item.id}
            key={item.id}
            a={answer}
            answeredCheck={answeredCheck}
            c={callback}
          >
            {`${show}`}
          </HiddenItem>
        )
      }
    } else {
      return {
        ...item,
        component: hinted ? (
          <span
            style={{ opacity: '0.3' }}
            onClick={
              e => e.stopPropagation() // prevent clicks within the hint from counting as an attempt
            }
          >
            {item.content}
          </span>
        ) : (
          <span>{item.content}</span>
        )
      }
    }
  })

  return {
    game: itemRenders.map(item => item.component),
    total: items.filter(item => item.type === 'hidden').length,
    items,
    hintAvailable: greatestAllAnswered && greatestAllAnswered.id
  }
}

function base64ToBytes (base64) {
  const binString = atob(base64)
  return Uint8Array.from(binString, m => m.codePointAt(0))
}

function bytesToBase64 (bytes) {
  const binString = Array.from(bytes, byte => String.fromCodePoint(byte)).join(
    ''
  )
  return btoa(binString)
}

/* decode an existing custom game */

let customGame = null
let decodedCustomGame = null
let hasCustomGame = false
try {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('customGame')) hasCustomGame = true
  const customGameUrlB64 = decodeURIComponent(urlParams.get('customGame'))

  const bytes = base64ToBytes(customGameUrlB64)
  decodedCustomGame = new TextDecoder().decode(bytes)
  customGame = buildGame(decodedCustomGame)
} catch (e) {
  console.error(e)
}

const DEFAULT_GAMES = {
  frogs_1: `Adult frogs can jump with <there|their> legs. They have long tongues<, | >that they <used|use> to catch bugs.
  They make a sound called a croak<, s|. S>ome <specie's|species> live in trees, and some types of frog are protected by being <poisenous|poisonous>.
Frogs live all over the world<...|.> If a foreign species of frogs<, | > is introduced to another <countries|country>, the 
  local ecosystem might be <effected|affected>.`,
  frogs_2: `A frog is any member of a diverse and largely carnivorous group of short-bodied<|,> tailless amphibians composing the order Anura (coming
from the Ancient Greek ἀνούρα, literally 'without tail'). The oldest fossil "proto-frog" Triadobatrachus is known from the Early Triassic of
Madagascar, but molecular clock dating <suggest|suggests> their split from other amphibians may <extends|extend> further back to the Permian, 
  265 million years ago. Frogs are widely distributed<. R|, r>anging from the tropics to subarctic regions<|,> but the greatest concentration of 
<species'|species> diversity is in tropical rainforest. <Frog's|Frogs> account for around 88% of extant amphibian species. They are also one of
the five most diverse <verterbrate|vertebrate> orders. Warty frog species tend to be called toads<|,> but the distinction between frogs and toads is
informal, not from taxonomy or <evolutionery|evolutionary> history.`
}

function App () {
  const [answered, setAnswered] = useState({})
  const [attempts, setAttempts] = useState(0)
  const [currentTip, setCurrentTip] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [currentCustomGameUrl, setCurrentCustomGameUrl] = useState(null)
  const [buildingCustomGame, setBuildingCustomGame] = useState(false)
  const [mode, setMode] = useState(
    hasCustomGame ? 'custom' : Object.keys(DEFAULT_GAMES)[0]
  )

  const c = id => setAnswered(ans => ({ ...ans, [id]: true }))
  const answeredCheck = id => answered[id]

  const {
    game,
    total: totalItems,
    hintAvailable
  } = hasCustomGame && customGame && mode === 'custom'
    ? customGame(c, answeredCheck, showHint)
    : buildGame(DEFAULT_GAMES[mode])(c, answeredCheck, showHint)

  const totalCorrected = Object.values(answered).filter(x => x).length
  const score = Math.round(((totalCorrected * 2 - attempts) / totalItems) * 100)

  const nearlyFinished =
    totalItems - totalCorrected <= Math.round(0.25 * totalItems)
  const finished = totalCorrected === totalItems
  const tips = [
    'Try looking for a spelling mistake.',
    "Try looking for some punctuation that shouldn't be there.",
    'Try looking for a missing or misused comma or apostrophe.',
    'Try looking for a missing or misused full stop.',
    'Try looking for a missing or misplaced suffix on a verb or noun (take/takes, book/books).'
  ]

  useEffect(() => {
    if (score < 0) {
      setCurrentTip(n => (n === tips.length - 1 ? 0 : n + 1))
    }
  }, [score])

  useEffect( () => {
    if (finished) {
      setShowHint(false)    
    }
  }, [finished])

  useEffect(() => {
    setAnswered({})
    setAttempts(0)
    setShowHint(false)
  }, [mode])

  const customGameSourceRef = useRef()

  return (
    <div
      style={{
        fontSize: '1.4em',
        margin: '0px 50px',
        lineHeight: '1.4em',
        maxWidth: '800px'
      }}
    >
      <p>
        <i>Can you find the punctuation and spelling mistakes?</i> 🤔
      </p>
      <p style={{ marginBottom: '1.2em', fontSize: '0.6em' }}>
        <div style={{ display: 'inline' }}>
          {Object.keys(DEFAULT_GAMES).map(gameName =>
            mode === gameName ? (
              <span style={{ marginRight: '8px' }} key={gameName}>
                {gameName}
              </span>
            ) : (
              <a
                href='#'
                key={gameName}
                style={{ marginRight: '8px' }}
                onClick={() => setMode(gameName)}
              >
                {gameName}
              </a>
            )
          )}
        </div>
        {mode === 'custom' && hasCustomGame && customGame ? (
          <span style={{ marginRight: '8px' }}>custom</span>
        ) : hasCustomGame && customGame ? (
          <a
            href='#'
            style={{ marginRight: '8px' }}
            onClick={() => setMode('custom')}
          >
            custom
          </a>
        ) : (
          ''
        )}
      </p>
      <p
        style={{ fontFamily: 'serif', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => {
          if (!finished) setAttempts(attempts => attempts + 1)
        }}
      >
        {game}
      </p>

      <p style={{ userSelect: 'none' }}>
        {'🐸 '.repeat(totalCorrected)}
        <span style={{ opacity: '0.2' }}>
          {' '}
          {'❔ '.repeat(totalItems - totalCorrected)}
        </span>
      </p>

      <div
        style={{
          fontFamily: 'sans-serif',
          fontSize: '0.8em',
          padding: '0.5em',
          margin: '1em',
          border: `1px solid ${
            score === 100
              ? 'gold'
              : score > 0
              ? 'green'
              : 'rgb(93, 93, 14, 0.1)'
          }`
        }}
      >
        <div
          style={{ color: totalCorrected === totalItems ? 'green' : 'black' }}
        >
          <b>{totalCorrected}</b>/{totalItems} corrected {finished ? '👏' : ''}{' '}
          with <b>{attempts}</b> click{attempts === 1 ? '' : 's'} for a score of{' '}
          <b style={{ color: score >= 0 ? 'green' : 'red' }}>{score}</b>{' '}
          {score > 0 ? '🤙' : ''}
        </div>
        {!finished && hintAvailable ? (
          <div style={{ fontSize: '0.8em' }}>
            <a href='#' onClick={() => setShowHint(hint => !hint)}>
              {showHint ? 'hide hints' : 'show hints'}
            </a>
            {showHint ? (
              <span>
                {' '}
                <i>You've found all the mistakes in the light region.</i>
              </span>
            ) : (
              <></>
            )}
          </div>
        ) : (
          <></>
        )}
        <div style={{ fontSize: '0.8em' }}>
          <i>{!finished && score < -10 ? tips[currentTip] : ''}</i>
        </div>
        <div style={{ fontSize: '0.8em' }}>
          {score > 0 && score !== 100 && finished
            ? 'Finished with a positive score, nice! 👌'
            : !finished && nearlyFinished
            ? 'Nearly there! Look out for missing commas, verb agreement and spelling mistakes... 👉'
            : ''}
        </div>
        <div>{score === 100 ? <b>Perfect score! 🥳</b> : ''}</div>
      </div>
      <div style={{ fontSize: '0.8em', margin: '1em 0px' }}>
        <a href='#' onClick={() => setBuildingCustomGame(val => !val)}>
          Create your own game
        </a>
      </div>

      {buildingCustomGame && (
        <div>
          <textarea
            style={{ width: '400px', height: '200px' }}
            id='customGameSource'
            ref={customGameSourceRef}
            defaultValue={`This is a custom game<. |!!! >The top <12%|1%> of the world's people own <85%|46%> of the world<s|'s> wealth.
<The|Das> <girl|Mädchen> <slept|schlief> <in the|im> <garden|Garten>.

`}
          />
          <div>
            <input
              type='button'
              style={{ fontSize: '1em' }}
              onClick={() => {
                try {
                  if (customGameSourceRef && customGameSourceRef.current) {
                    const encoded = encodeURIComponent(
                      bytesToBase64(
                        new TextEncoder().encode(
                          customGameSourceRef.current.value
                        )
                      )
                    )
                    setCurrentCustomGameUrl(`${BASE_URL}?customGame=${encoded}`)
                  }
                } catch (e) {
                  console.error('failed to build', e)
                }
              }}
              value='Create'
            />
          </div>
          <p style={{ fontSize: '0.6em', color: '#555' }}>
            <i>
              Put the corrections inside angle brackets separated by '|' (pipe
              symbol). The text to the left of the pipe will be corrected to the
              text on the right when clicked.
            </i>
          </p>

          {currentCustomGameUrl && (
            <div
              style={{
                fontSize: '0.6em',
                marginTop: '1em',
                wordBreak: 'break-all'
              }}
            >
              <a target='_blank' href={currentCustomGameUrl}>
                {currentCustomGameUrl}
              </a>
              <br />
              Follow the link or copy and share to play
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: '0.5em', color: '#333' }}>
        Texts adapted from{' '}
        <a href='https://en.wikipedia.org/wiki/Frog'>Wikipedia: Frog</a>,{' '}
        <a href='https://simple.wikipedia.org/wiki/Frog'>
          Simple Wikipedia: Frog
        </a>{' '}
        under Creative Commons license{' '}
        <a href='https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License'>
          CC BY-SA 4.0
        </a>
      </p>
    </div>
  )
}

export default App
