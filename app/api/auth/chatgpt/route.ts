import { getChatGPTUser } from "../../../chatgpt-auth"

export async function GET() {
  return Response.json({ user: await getChatGPTUser() })
}
