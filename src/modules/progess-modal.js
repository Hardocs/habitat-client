import { modalOnFileHtml } from './habitat-localservices'

class ProgessModal {

  indicatorHtml = null
  label = null
  options = {
    height: 480,
    width: 600,
    backgroundColor: '#0d3856',
    timeOut: 1500,
    timeIn: 1000,
  }
  timer = null
  modal = null

  constructor (indicatorHtml = 'waiting.html', options = null) {
    this.indicatorHtml = indicatorHtml
    if (options) {
      this.options = options
    }
  }

  initiate (label = 'ProgressModal') {
    console.log ('ProgressModal initiating on: ' + label)
    this.label = label
    this.modal = modalOnFileHtml(this.indicatorHtml, this.options)
      .then(result => {
        this.modal = result
        this.timer = setTimeout(function () {
          // delay open of modal, avoid showing if we're very fast
          this.modal.show()
        }.bind(this), this.options.timeIn)
      })
      .catch (err => {
        throw new Error('modal:' + this.label + ':' + err )
      })
  }

  complete () {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.timer = null
    if (this.modal) {
      setTimeout (function () {
        // delay close of modal, avoid flash in case we're fast
        this.modal.close()
        // somehow even this next doesn't get rid of Electron's problem: it will
        // throw a JSON.stringify error if this object isn't constructed each time for use
        // unless I'm missing something obvious...
        this.modal = null
      }.bind(this), this.options.timeOut)
    }
    this.label = null
  }
}

export { ProgessModal }
