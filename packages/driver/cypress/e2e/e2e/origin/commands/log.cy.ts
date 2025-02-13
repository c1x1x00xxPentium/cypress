import { assertLogLength } from '../../../../support/utils'

context('cy.origin log', { browser: '!webkit' }, () => {
  let logs: any = []
  let lastTestLogId = ''

  beforeEach(() => {
    logs = []

    cy.on('log:added', (attrs, log) => {
      logs.push(log)
    })

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('logs in primary and secondary origins', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const afterLogAdded = new Promise<void>((resolve) => {
        const listener = (attrs) => {
          if (attrs.message === 'test log in cy.origin') {
            expect(attrs.message).to.eq('test log in cy.origin')
            cy.removeListener('log:added', listener)
            resolve(attrs.id)
          }
        }

        cy.on('log:added', listener)
      })

      cy.log('test log in cy.origin')
      cy.wrap(afterLogAdded)
    }).then((id) => {
      lastTestLogId = id as string
      // Verify the log is also fired in the primary origin.
      expect(logs[6].get('message')).to.eq('test log in cy.origin')
      // Verify the log has the same ID as was generated in the cross-origin
      expect(logs[6].get('id')).to.equal(id)
      assertLogLength(logs, 11)
    })
  })

  it('has a different id in a second test', () => {
    cy.origin('http://www.foobar.com:3500', () => {
      const afterLogAdded = new Promise<void>((resolve) => {
        const listener = (attrs) => {
          if (attrs.message === 'test log in cy.origin') {
            expect(attrs.message).to.eq('test log in cy.origin')
            cy.removeListener('log:added', listener)
            resolve(attrs.id)
          }
        }

        cy.on('log:added', listener)
      })

      cy.log('test log in cy.origin')
      cy.wrap(afterLogAdded)
    }).then((id) => {
      // Verify the log is also fired in the primary origin.
      expect(logs[6].get('message')).to.eq('test log in cy.origin')
      // Verify the log has the same ID as was generated in the cross-origin
      expect(logs[6].get('id')).to.equal(id)
      expect(logs[6].get('id')).to.not.equal(lastTestLogId)
      assertLogLength(logs, 12)
    })
  })

  it('does not send hidden logs to primary origin when protocol is disabled', { protocolEnabled: false }, function () {
    cy.on('_log:added', (attrs, log) => {
      this.hiddenLog = log
    })

    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#select-maps').select('train', { log: false })
    }).then((id) => {
      // Verify the log is also fired in the primary origin.
      expect(logs.length).to.eq(7)
      expect(logs[6].get('name'), 'log name').to.eq('get')
      expect(logs[6].get('hidden'), 'log hidden').to.be.false

      expect(this.hiddenLog).to.be.undefined
    })
  })

  it('handles sending hidden logs to primary origin when protocol enabled', { protocolEnabled: true }, function () {
    cy.on('_log:added', (attrs, log) => {
      this.hiddenLog = log
    })

    cy.origin('http://www.foobar.com:3500', () => {
      cy.get('#select-maps').select('train', { log: false })
    }).then((id) => {
      // Verify the log is also fired in the primary origin.
      expect(logs.length).to.eq(7)
      expect(logs[6].get('name'), 'log name').to.eq('get')
      expect(logs[6].get('hidden'), 'log hidden').to.be.false
      expect(this.hiddenLog).to.be.ok
      expect(this.hiddenLog.get('name'), 'log name').to.eq('select')
      expect(this.hiddenLog.get('hidden'), 'log hidden').to.be.true
    })
  })
})
