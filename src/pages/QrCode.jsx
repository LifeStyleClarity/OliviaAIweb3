import React from "react";
import { Button } from "@heroui/react";

function QrCode() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
            <div className="max-w-sm w-full  rounded-lg shadow-lg p-6 text-center">
                <h2 className="text-[32px] font-bold mb-4 text-white">
                    Open in Telegram
                </h2>
                <p className="text-[16px] mb-6 text-white">
                    Our app can only be accessed via Telegram. <br />
                    Scan the QR code below to continue.
                </p>
                <img
                    src="/qr-code-olivia.png"
                    alt="QR Code"
                    className="w-100 h-100 mx-auto mb-4"
                />
                <p className="text-[16px] text-white">
                    Make sure you have the latest version of Telegram installed.
                </p>
                <div className="mt-3 w-full flex justify-center">
                    <Button onPress={() => window.open("https://t.me/Olivia_AGI_Bot", "_blank")} className=" bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] text-gray-900 rounded-xl">Open in Telegram</Button>
                </div>
            </div>
        </div>
    );
}

export default QrCode;
