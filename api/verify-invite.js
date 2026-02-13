export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { code } = req.body;
    const correctCode = process.env.INVITE_CODE;

    if (!correctCode) {
        console.error("INVITE_CODE environment variable is not set!");
        return res.status(500).json({ message: "Server configuration error" });
    }

    if (code === correctCode) {
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ success: false, message: "Invalid code" });
    }
}
