(function (win, doc) {

  // Sprite model

  /**
   * Base sprite object creator
   * @param {Object} sprite properties and dimensions
   * @returns {Object} base sprite object
   */
  function sprite ({ columns, rows, ...sprite }) {
    return {
      ...sprite,
      currFrame: 0,
      frames: [...Array(columns * rows)],
      column: sprite.width / columns,
      row: sprite.height / rows
    }
  }

  /**
   * Pre calculate each frame's background x and y position in sequence
   * @param {Object}
   * @returns {Object} sprite clone appended with frames array
   */
  function backgroundPositions ({ frames = [], ...sprite }) {

    for (let i = 0, x = 0, y = 0; i < frames.length; i++) {
      frames[i] = { x, y }
      x = (x - sprite.column) % sprite.width
      if (x === 0) y -= sprite.row
    }
    return { ...sprite, frames }
  }

  // Sprite methods @return amended sprite clone

  function nextFrame (sprite) {
    const { currFrame, frames: { length } } = sprite
    return { ...sprite, currFrame: (currFrame + 1) % length }
  }

  function prevFrame (sprite) {
    const { currFrame, frames: { length } } = sprite
    return { ...sprite, currFrame: (currFrame === 0) ? length - 1 : currFrame - 1 }
  }

  const setScrollY = (sprite, scrollY) => ({ ...sprite, scrollY })

  // Sprite methods @return sprite values

  const getFrame = ({ frames, currFrame }) => frames[currFrame]


  /* Helpers */

  const pipe = (...funcs) => arg => funcs.reduce((obj, func) => func(obj), arg)

  const bindRest = (fn, ...rest) => (...args) => fn(...args, ...rest)

  // calculate if element is vertically in view
  const elementInViewY = ((win, docElement) => (element, height = 0) => {

    const { top, bottom } = element.getBoundingClientRect()
    return top >= -height && bottom <= (win.innerHeight || docElement.clientHeight) + height

  })(window, document.documentElement)

  /**
   * Throttles each event call to handler e.g scroll event
   * @param {Function} event handler
   * @param {Number} wait - milliseconds between each event handler call
   */
  function throttle (handler, wait = 30) {
    let timer = null

    return (event) => {
      if (timer !== null) return

      timer = setTimeout(() => {
        clearTimeout(timer)
        timer = null

        handler.call(event.target, event)
      }, wait)
    }
  }

  // Handlers

  /**
   * @param {Object} spriteElement - includes { target, width, height, columns, rows, {Array} frames }
   * @returns {Function} Handler
   */
  function getScrollHandler (spriteElement) {

    // return handler
    return (event) => {

      // update spriteElement
      spriteElement = setScrollY(

        window.pageYOffset > spriteElement.scrollY
          ? nextFrame(spriteElement)
          : prevFrame(spriteElement),

        window.pageYOffset
      )

      const target = spriteElement.target

      if (!elementInViewY(target, spriteElement.row)) return

      window.requestAnimationFrame(() => {
        target.style.backgroundPositionX = `${getFrame(spriteElement).x}px`
        target.style.backgroundPositionY = `${getFrame(spriteElement).y}px`
      })
    }
  }

  // Main user functions

  function spritePlayOnScroll (target, spriteProps, wait = 30) {
    win.addEventListener(
      'scroll',
      throttle(
        getScrollHandler(
          pipe(
            sprite,
            backgroundPositions,
            bindRest(setScrollY, window.pageYOffset)
          )({ ...spriteProps, target })
        ),
        wait
      )
    )
  }

  // append user function to window
  win.spritePlayOnScroll = spritePlayOnScroll
}(window, window.document))
