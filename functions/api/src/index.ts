// Register vendor providers
import { providerRegistry } from "./shared/providers/registry";
import { MicrosoftCertProvider } from "./shared/providers/microsoft";
import { AWSCertProvider } from "./shared/providers/aws";
import { CompTIACertProvider } from "./shared/providers/comptia";

providerRegistry.register(new MicrosoftCertProvider());
providerRegistry.register(new AWSCertProvider());
providerRegistry.register(new CompTIACertProvider());

// Register all function handlers (Azure Functions v4 model)
import "./functions/users/getProfile";
import "./functions/users/updateProfile";
import "./functions/certifications/list";
import "./functions/certifications/getById";
import "./functions/certifications/update";
import "./functions/certifications/remove";
import "./functions/certifications/sync";
import "./functions/credly/preview";
import "./functions/credly/unlink";
import "./functions/reminders/getPreferences";
import "./functions/reminders/updatePreferences";
import "./functions/reminders/testNotification";
import "./functions/providers/listProviders";
