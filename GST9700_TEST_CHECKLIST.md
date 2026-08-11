# GST-9700 field test

1. Use Chrome/Edge desktop over HTTPS.
2. Connect the GST-9700 through its configured RS-232/USB-serial interface.
3. Open the weighing page and go to Setting Port.
4. Select the baud rate configured on the GST-9700 (start with the indicator's actual configured value; do not guess in production).
5. Click Connect GST-9700 and select the serial device.
6. Put a known load on the scale and verify the displayed weight changes in realtime.
7. Click TIMBANG KOSONG to copy the current stable weight to Tara.
8. After loading the vehicle, verify TIMBANG ISI copies the current weight to Bruto and Netto is calculated from Bruto - Tara.
9. If the status says connected but the weight remains blank, the serial parameters or the indicator's output protocol need to be matched to the GST-9700 configuration.
