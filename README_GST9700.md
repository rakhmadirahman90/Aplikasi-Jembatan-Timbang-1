# GST-9700 Integration Status

The weighing application now includes a real browser serial integration layer for the GST-9700 indicator.

## What changed
- Replaced the legacy simulated Connect behavior with a real Web Serial connection.
- Added configurable serial speed: 1200, 2400, 4800, 9600, 19200 and 38400 baud.
- Uses 8 data bits, 1 stop bit, no parity and no flow control by default.
- Reads live ASCII serial frames and parses common weight formats.
- Updates gross/tare/netto weighing fields in realtime.
- Displays explicit connected/disconnected/error status.
- Handles physical USB/serial disconnects.
- Added Vercel configuration so the Node server injects the integration script into the weighing page.

## Important
The serial speed and output format must match the GST-9700's configured RS-232 parameters. If the indicator uses another frame format, the live raw serial payload should be captured and the parser can be adjusted without changing the weighing workflow.
