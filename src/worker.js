import { UPDATE } from "./protocol"

self.onconnect = (e) => {
  const port = e.ports[0]

  port.addEventListener("message", (event) => {
    if (event.data.type === UPDATE) {
      console.log("UPDATE EVENT", event.data)
    }
  })

  port.start()
}
