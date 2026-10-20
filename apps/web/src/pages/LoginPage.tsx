import { Button, Center, Stack, Text, Title } from "@mantine/core";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { login, loading } = useAuth();

  if (loading) {
    return <Center mih="100vh"><Text>Loading...</Text></Center>;
  }

  return (
    <Center mih="100vh" p="md">
      <Stack align="center" gap="xl">
        <Title order={1} c="teal" ta="center" size="3rem">BrkRoutnXdle</Title>
        <Text maw={400} ta="center">
          Generate optimized weekly schedules from your Google Calendar.
          Define tasks, set preferences, and let the algorithm do the rest.
        </Text>
        <Button onClick={login} size="lg" radius="xl">Login with Google</Button>
      </Stack>
    </Center>
  );
}
