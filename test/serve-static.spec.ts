/*
 * @adonisjs/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../adonis-typings/index.ts" />

import test from 'japa'
import { join } from 'path'
import supertest from 'supertest'
import { createServer } from 'http'

import { setupApp, fs } from '../test-helpers'
import { ServeStatic } from '../src/Hooks/Static'

test.group('Serve Static', (group) => {
  group.afterEach(async () => {
    process.removeAllListeners('SIGINT')
    process.removeAllListeners('SIGTERM')

    await fs.cleanup()
  })

  test('serve static file when it exists', async (assert) => {
    await fs.add('public/style.css', 'body { background: #000 }')
    const app = await setupApp()

    const server = createServer(async (req, res) => {
      const serveStatic = new ServeStatic(join(fs.basePath, 'public'), {
        enabled: true,
      })
      const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {}, req, res)
      await serveStatic.handle(ctx)

      assert.equal(ctx.response.response.listenerCount('finish'), 1)
      assert.isTrue(ctx.response.finished)
    })

    const { text } = await supertest(server).get('/style.css')
    assert.equal(text, 'body { background: #000 }')
  })

  test('pass through when unable to lookup file', async (assert) => {
    await fs.add('public/style.css', 'body { background: #000 }')
    const app = await setupApp()

    const server = createServer(async (req, res) => {
      const serveStatic = new ServeStatic(join(fs.basePath, 'public'), {
        enabled: true,
      })
      const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {}, req, res)
      await serveStatic.handle(ctx)

      assert.equal(ctx.response.response.listenerCount('finish'), 1)
      assert.isFalse(ctx.response.finished)

      ctx.response.status(404).send('404')
      ctx.response.finish()
    })

    await supertest(server).get('/').expect(404)
  })
})
